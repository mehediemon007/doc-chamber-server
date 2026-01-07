import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm'; // Added FindOptionsWhere
import { Patient } from '../patients/entities/patient.entity';
import { Booking } from './entities/booking.entity';
import { Chamber } from '../chambers/entities/chamber.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

// Strict interface for results
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

  async create(dto: CreateBookingDto, patientId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chamber = await queryRunner.manager.findOne(Chamber, {
        where: { id: dto.chamberId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!chamber) throw new NotFoundException('Chamber not found');

      if (!chamber.isBookingOpen) {
        throw new BadRequestException('Bookings are currently closed.');
      }

      const isExtra = chamber.totalBooked >= chamber.maxPatients;
      const nextSerial = chamber.totalBooked + 1;

      const booking = queryRunner.manager.create(Booking, {
        serialNumber: nextSerial,
        bookingDate: dto.bookingDate,
        status: isExtra ? 'extra' : 'pending',
        patient: { id: patientId } as Patient,
        chamber: { id: dto.chamberId } as Chamber,
      });

      chamber.totalBooked = nextSerial;
      await queryRunner.manager.save(Chamber, chamber);
      const savedBooking = await queryRunner.manager.save(Booking, booking);

      await queryRunner.commitTransaction();

      return {
        message: isExtra
          ? 'Booking confirmed as extra serial'
          : 'Booking successful',
        data: savedBooking,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // FIXED: Added FindOptionsWhere to avoid 'as any' on the date string
  async findAllByChamber(chamberId: string, date: string) {
    const where: FindOptionsWhere<Booking> = {
      chamber: { id: chamberId },
      bookingDate: date,
    };

    return this.bookingRepository.find({
      where,
      relations: ['patient'],
      order: { serialNumber: 'ASC' },
    });
  }

  // FIXED: Removed 'as any' and implemented null-safe mapping
  async getDailyQueue(chamberId: string) {
    const today = this.getTodayDate();

    const where: FindOptionsWhere<Booking> = {
      chamber: { id: chamberId },
      bookingDate: today,
    };

    const bookings = await this.bookingRepository.find({
      where,
      relations: {
        patient: {
          medicalRecords: true,
        },
      },
      order: { serialNumber: 'ASC' },
    });

    // Map using the strict interface
    return (bookings as BookingWithPatientHistory[]).map((b) => {
      const historyCount = b.patient.medicalRecords?.length ?? 0;

      return {
        serial: b.serialNumber,
        patientName: b.patient.fullName ?? 'Unknown Patient',
        status: b.status,
        hasPreviousHistory: historyCount > 0,
        historyCount: historyCount,
        phone: b.patient.phone ?? 'No Phone',
      };
    });
  }
}
