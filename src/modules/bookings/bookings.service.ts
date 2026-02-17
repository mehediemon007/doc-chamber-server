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
import { QueueItemDto } from './dto/queue-item.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Chamber)
    private readonly chamberRepository: Repository<Chamber>,
    private readonly dataSource: DataSource,
  ) {}

  // Helper: Get strictly the Date string (YYYY-MM-DD) for Dhaka
  private getTodayDate(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  // Helper: Get strictly the current Hour (0-23) for Dhaka
  private getCurrentDhakaHour(): number {
    const hourPart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    return parseInt(hourPart, 10);
  }

  /**
   * ATOMIC CREATE
   * Uses Pessimistic Locking to prevent duplicate serial numbers.
   */
  async create(
    dto: CreateBookingDto,
    tenantId: string, // Sourced from Middleware (Secure)
    loggedInUserId?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let patient: Patient | null = null;

      // 1. Establish the Patient Record
      if (loggedInUserId) {
        patient = await queryRunner.manager.findOne(Patient, {
          where: { id: loggedInUserId },
        });
      } else {
        if (!dto.phone || !dto.fullName) {
          throw new BadRequestException(
            'Guest bookings require Phone and Name',
          );
        }

        // Check if patient exists (global lookup or scoped by tenant if needed)
        patient = await queryRunner.manager.findOne(Patient, {
          where: { phone: dto.phone },
        });

        // Create new patient if they don't exist
        if (!patient) {
          const newPatient = queryRunner.manager.create(Patient, {
            fullName: dto.fullName,
            phone: dto.phone,
          });
          patient = await queryRunner.manager.save(Patient, newPatient);
        }
      }

      if (!patient) throw new BadRequestException('Could not resolve patient');

      // 2. Lock the Chamber Context
      // We lock the chamber row so no other request can generate a serial
      // for this specific chamber until we are done.
      const chamber = await queryRunner.manager.findOne(Chamber, {
        where: { id: tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!chamber) throw new NotFoundException('Chamber not found');

      // 3. Smart Serial Calculation
      const todayString = this.getTodayDate();
      const isForToday = dto.bookingDate === todayString;

      let nextSerial: number;

      if (isForToday) {
        // OPTION A: If it's today, we can use the cached counter on the Chamber entity
        // This is efficient because we already locked the Chamber row.
        nextSerial = (chamber.totalBooked || 0) + 1;

        // Update the cache
        chamber.totalBooked = nextSerial;
        await queryRunner.manager.save(Chamber, chamber);
      } else {
        // OPTION B: If it's a future date, we count the existing bookings in the DB.
        // Since we hold the 'pessimistic_write' lock on the Chamber,
        // no one else can insert into this chamber right now, so `count` is safe.
        const count = await queryRunner.manager.count(Booking, {
          where: {
            chamber: { id: tenantId },
            bookingDate: dto.bookingDate,
          },
        });
        nextSerial = count + 1;
      }

      const isExtra = nextSerial > chamber.maxPatients;

      // 4. Create and Save Booking
      const booking = queryRunner.manager.create(Booking, {
        serialNumber: nextSerial,
        bookingDate: dto.bookingDate,
        status: isExtra ? 'extra' : 'pending',
        patient: patient,
        chamber: chamber,
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();

      return {
        message: isExtra
          ? `Booking Confirmed (Extra #${nextSerial})`
          : 'Booking Successful',
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
   * DOCTOR VIEW: Daily Queue
   */
  async getDailyQueue(chamberId: string): Promise<QueueItemDto[]> {
    const today = this.getTodayDate();

    const bookings = await this.bookingRepository.find({
      where: {
        chamber: { id: chamberId },
        bookingDate: today,
      },
      relations: {
        patient: {
          medicalRecords: true,
        },
      },
      order: { serialNumber: 'ASC' },
    });

    return bookings.map((b) => ({
      serial: b.serialNumber,
      patientName: b.patient.fullName,
      status: b.status,
      historyCount: b.patient.medicalRecords?.length ?? 0,
      phone: b.patient.phone,
      patientId: b.patient.id,
    }));
  }

  /**
   * ANALYTICS VIEW: Unique Patients
   * SUPER PRO UPGRADE: Uses QueryBuilder for performance.
   */
  async getChamberPatients(chamberId: string) {
    // Instead of fetching 10,000 bookings and filtering in JS (slow/crashy),
    // we let the database do the heavy lifting with DISTINCT.

    return (
      this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.patient', 'patient')
        .where('booking.chamberId = :chamberId', { chamberId })
        // We group by patient ID to ensure uniqueness
        .groupBy('patient.id')
        .addGroupBy('patient.fullName')
        .addGroupBy('patient.phone')
        .select([
          'patient.id AS id',
          'patient.fullName AS fullName',
          'patient.phone AS phone',
          'COUNT(booking.id) as totalVisits', // visits count
          'MAX(booking.bookingDate) as lastVisit', // last visit date
        ])
        .getRawMany()
    );
  }
}
