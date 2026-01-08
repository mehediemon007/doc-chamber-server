import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Booking } from './entities/booking.entity';
import { Chamber } from '../chambers/entities/chamber.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

// Strict interface for results to ensure type safety in mapping
interface BookingWithPatientHistory extends Booking {
  patient: Patient;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Chamber)
    private readonly chamberRepository: Repository<Chamber>,
    private readonly dataSource: DataSource,
  ) {}

  private getTodayDate(): string {
    return new Date().toLocaleDateString('en-CA');
  }

  /**
   * ATOMIC CREATE
   */
  async create(dto: CreateBookingDto, patientId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const patientExists = await queryRunner.manager.findOne(Patient, {
        where: { id: patientId },
      });

      if (!patientExists) {
        throw new BadRequestException(`Patient record not found.`);
      }

      const chamber = await queryRunner.manager.findOne(Chamber, {
        where: { id: dto.chamberId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!chamber) throw new NotFoundException('Chamber not found');

      const isForToday = dto.bookingDate === this.getTodayDate();
      let nextSerial: number;

      if (isForToday) {
        nextSerial = (chamber.totalBooked || 0) + 1;
        chamber.totalBooked = nextSerial;
        await queryRunner.manager.save(Chamber, chamber);
      } else {
        const count = await queryRunner.manager.count(Booking, {
          where: {
            chamber: { id: dto.chamberId },
            bookingDate: dto.bookingDate,
          },
        });
        nextSerial = count + 1;
      }

      const isExtra = nextSerial > chamber.maxPatients;

      const booking = queryRunner.manager.create(Booking, {
        serialNumber: nextSerial,
        bookingDate: dto.bookingDate,
        status: isExtra ? 'extra' : 'pending',
        patient: { id: patientId } as Patient,
        chamber: { id: dto.chamberId } as Chamber,
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();

      return {
        message: isExtra ? 'Booking confirmed as extra' : 'Booking successful',
        data: savedBooking,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * MULTI-TENANCY VIEW: Doctor/Staff only sees their own chamber's queue
   */
  async getDailyQueue(chamberId: string) {
    const today = this.getTodayDate();

    const bookings = await this.bookingRepository.find({
      where: {
        chamber: { id: chamberId }, // Filter by Doctor's Chamber ID
        bookingDate: today,
      },
      relations: {
        patient: {
          medicalRecords: true,
        },
      },
      order: { serialNumber: 'ASC' },
    });

    return (bookings as BookingWithPatientHistory[]).map((b) => ({
      serial: b.serialNumber,
      patientName: b.patient.fullName,
      status: b.status,
      historyCount: b.patient.medicalRecords?.length ?? 0,
      phone: b.patient.phone,
      patientId: b.patient.id,
    }));
  }

  /**
   * DOCTOR VIEW: See all unique patients that belong to this chamber
   */
  async getChamberPatients(chamberId: string) {
    // This query finds all patients who have at least one booking in this chamber
    const bookings = await this.bookingRepository.find({
      where: { chamber: { id: chamberId } },
      relations: ['patient'],
      select: {
        id: true,
        patient: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    });

    // Remove duplicates from the list to show unique patients
    const uniquePatients = Array.from(
      new Map(bookings.map((b) => [b.patient.id, b.patient])).values(),
    );

    return uniquePatients;
  }
}
