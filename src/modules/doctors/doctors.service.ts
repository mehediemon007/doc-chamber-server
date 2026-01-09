import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { Chamber } from '../chambers/entities/chamber.entity';
import { User } from '../users/entities/user.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  /**
   * Scenario 1 & 2: Create a profile.
   * If userId is provided, it links immediately (Active).
   * If not, it remains a "Lead" (Prospect).
   */
  async create(
    createDoctorDto: CreateDoctorDto & { chamberId?: string },
  ): Promise<Doctor> {
    const { chamberId, userId, ...doctorData } = createDoctorDto;

    const newDoctor = this.doctorRepository.create({
      ...doctorData,
      // Use undefined to satisfy DeepPartial and Scenario 1 logic
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
   * Scenario 2: Transition a Lead to an Active Member
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

  /**
   * Finds all doctors in a chamber.
   * Includes strict type checking for the where condition.
   */
  async findAllByChamber(
    chamberId: string,
    isPatient: boolean = false,
  ): Promise<Doctor[]> {
    // Define the query filter strictly using TypeORM types to avoid ESLint 'any' errors
    const whereCondition: FindOptionsWhere<Doctor> = {
      chambers: { id: chamberId },
      isActive: true,
    };

    // If a patient is calling, only show doctors who have officially joined
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

  /**
   * Admin-only: Find every active doctor in the system
   */
  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: { isActive: true },
      relations: ['user'],
    });
  }
}
