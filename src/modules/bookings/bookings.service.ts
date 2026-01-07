import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { Booking } from './entities/booking.entity';
import { Chamber } from '../chambers/entities/chamber.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Chamber)
    private chamberRepository: Repository<Chamber>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto, patientId: string) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch chamber with a lock to prevent serial number duplication
      const chamber = await queryRunner.manager.findOne(Chamber, {
        where: { id: dto.chamberId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!chamber) {
        throw new NotFoundException('Chamber not found');
      }

      // 2. CHECK: Manual override
      // Since 'chamber' is an instance of the Chamber entity,
      // TypeScript knows 'isBookingOpen' exists.
      if (!chamber.isBookingOpen) {
        throw new BadRequestException(
          'Bookings are currently closed for this chamber.',
        );
      }

      // 3. CALCULATION: Relaxed Logic
      // If current bookings are >= maxPatients, we still allow it but mark as 'extra'
      const isExtra = chamber.totalBooked >= chamber.maxPatients;
      const nextSerial = chamber.totalBooked + 1;

      // 4. CREATE: The Booking entry
      const booking = queryRunner.manager.create(Booking, {
        serialNumber: nextSerial,
        bookingDate: dto.bookingDate,
        status: isExtra ? 'extra' : 'pending',
        // Use the actual Classes instead of 'any'
        patient: { id: patientId } as Patient,
        chamber: { id: dto.chamberId } as Chamber,
      });

      // 5. UPDATE: Chamber's total counter
      chamber.totalBooked = nextSerial;
      await queryRunner.manager.save(chamber);

      const savedBooking = await queryRunner.manager.save(booking);

      // Commit everything to the database
      await queryRunner.commitTransaction();

      return {
        message: isExtra
          ? 'Booking confirmed as extra serial'
          : 'Booking successful',
        data: savedBooking,
      };
    } catch (err) {
      // If anything fails, undo all changes
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Release the database connection back to the pool
      await queryRunner.release();
    }
  }

  async findAllByChamber(chamberId: string, date: string) {
    return this.bookingRepository.find({
      where: {
        chamber: { id: chamberId },
        bookingDate: date,
      },
      relations: ['patient'],
      order: { serialNumber: 'ASC' },
    });
  }
}
