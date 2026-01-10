import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import {
  Chamber,
  DoctorTravelStatus,
} from '../chambers/entities/chamber.entity';
import { User } from '../users/entities/user.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMidnightReset() {
    console.log('Running Midnight Reset for all Chambers and Doctors...');

    // 1. Reset all chambers
    await this.doctorRepository
      .createQueryBuilder()
      .update(Chamber)
      .set({
        travelStatus: DoctorTravelStatus.AT_HOME,
        currentSerial: 0,
        delayMinutes: 0,
      })
      .execute();

    // 2. Reset all doctors tracking status
    await this.doctorRepository
      .createQueryBuilder()
      .update(Doctor)
      .set({
        isHeadingToChamber: false,
        currentLat: null,
        currentLng: null,
      })
      .execute();

    console.log('Midnight Reset Complete.');
  }

  /**
   * Scenario 1 & 2: Create a profile.
   */
  async create(
    createDoctorDto: CreateDoctorDto & { chamberId?: string },
  ): Promise<Doctor> {
    const { chamberId, userId, ...doctorData } = createDoctorDto;

    const newDoctor = this.doctorRepository.create({
      ...doctorData,
      user: userId ? ({ id: userId } as User) : undefined,
      hasJoinedPlatform: !!userId,
    });

    if (chamberId) {
      newDoctor.chambers = [{ id: chamberId } as Chamber];
    }

    try {
      return await this.doctorRepository.save(newDoctor);
    } catch (err: unknown) {
      console.error('Doctor Creation Error:', err);
      const message =
        err instanceof Error ? err.message : 'Database operation failed';
      throw new BadRequestException(
        'Could not create doctor profile.',
        message,
      );
    }
  }

  /**
   * Scenario 2: Link a Lead to an Active User account
   */
  async linkUserAccount(doctorId: string, userId: string): Promise<Doctor> {
    const doctor = await this.findOne(doctorId);

    if (doctor.user) {
      throw new BadRequestException(
        'This doctor profile is already linked to a user.',
      );
    }

    doctor.user = { id: userId } as User;
    doctor.hasJoinedPlatform = true;

    return await this.doctorRepository.save(doctor);
  }

  async findAllByChamber(
    chamberId: string,
    isPatient: boolean = false,
  ): Promise<Doctor[]> {
    const whereCondition: FindOptionsWhere<Doctor> = {
      chambers: { id: chamberId },
      isActive: true,
    };

    if (isPatient) {
      whereCondition.hasJoinedPlatform = true;
    }

    return this.doctorRepository.find({
      where: whereCondition,
      relations: ['chambers', 'user'],
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['chambers', 'user'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);
    return this.doctorRepository.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: { isActive: true },
      relations: ['user'],
    });
  }

  // ==========================================
  // LIVE LOCATION & JOURNEY LOGIC
  // ==========================================

  async startJourney(doctorId: string, chamberId: string): Promise<void> {
    // 1. Update Doctor state to activate tracking
    await this.doctorRepository.update(doctorId, {
      isHeadingToChamber: true,
      lastLocationUpdate: new Date(),
    });

    // 2. Set the Chamber status to ON_THE_WAY using QueryBuilder
    // We target the Chamber table specifically to update its status enum
    await this.doctorRepository
      .createQueryBuilder()
      .update(Chamber)
      .set({ travelStatus: DoctorTravelStatus.ON_THE_WAY })
      .where('id = :chamberId', { chamberId })
      .execute();
  }

  async updateLiveLocation(
    doctorId: string,
    lat: number,
    lng: number,
    isHeading: boolean,
  ): Promise<void> {
    await this.doctorRepository.update(doctorId, {
      currentLat: lat,
      currentLng: lng,
      isHeadingToChamber: isHeading,
      lastLocationUpdate: new Date(),
    });
  }

  async handleArrival(doctorId: string, chamberId: string): Promise<void> {
    // 1. Update the Chamber Status to IN_CHAMBER
    await this.doctorRepository
      .createQueryBuilder()
      .update(Chamber)
      .set({ travelStatus: DoctorTravelStatus.IN_CHAMBER })
      .where('id = :chamberId', { chamberId })
      .execute();

    // 2. Reset Doctor's transit state (stop tracking)
    await this.doctorRepository.update(doctorId, {
      isHeadingToChamber: false,
    });

    console.log(`Doctor ${doctorId} arrived at chamber ${chamberId}.`);
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  async reportDelay(chamberId: string, minutes: number): Promise<void> {
    await this.doctorRepository
      .createQueryBuilder()
      .update(Chamber)
      .set({
        delayMinutes: minutes,
        travelStatus: DoctorTravelStatus.DELAYED,
      })
      .where('id = :chamberId', { chamberId })
      .execute();
  }

  async callNextPatient(chamberId: string): Promise<number> {
    // 1. Fetch the chamber to check current state
    const chamber = await this.doctorRepository
      .createQueryBuilder()
      .select('chamber')
      .from(Chamber, 'chamber')
      .where('chamber.id = :chamberId', { chamberId })
      .getOne();

    if (!chamber) {
      throw new NotFoundException('Chamber not found');
    }

    // 2. Prevent incrementing if we've reached the end of the booked list
    if (chamber.currentSerial >= chamber.totalBooked) {
      throw new BadRequestException('All booked patients have been called.');
    }

    const nextSerial = chamber.currentSerial + 1;

    // 3. Update the serial in the database
    await this.doctorRepository
      .createQueryBuilder()
      .update(Chamber)
      .set({ currentSerial: nextSerial })
      .where('id = :chamberId', { chamberId })
      .execute();

    return nextSerial;
  }

  async endSession(doctorId: string, chamberId: string): Promise<void> {
    // 1. Reset the Chamber to default "Offline" state
    await this.doctorRepository
      .createQueryBuilder()
      .update(Chamber)
      .set({
        travelStatus: DoctorTravelStatus.AT_HOME,
        currentSerial: 0,
        delayMinutes: 0,
        // We keep totalBooked as it is for historical/reporting records for that day
      })
      .where('id = :chamberId', { chamberId })
      .execute();

    // 2. Reset the Doctor's live tracking state
    await this.doctorRepository.update(doctorId, {
      isHeadingToChamber: false,
      currentLat: null,
      currentLng: null,
    });

    console.log(`Session ended for Doctor ${doctorId} at Chamber ${chamberId}`);
  }
}
