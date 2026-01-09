import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(
    createDoctorDto: CreateDoctorDto & { chamberId?: string },
  ): Promise<Doctor> {
    const { chamberId, userId, ...doctorData } = createDoctorDto;

    const newDoctor = this.doctorRepository.create({
      ...doctorData,
      user: { id: userId } as User,
    });

    if (chamberId) {
      newDoctor.chambers = [{ id: chamberId } as Chamber];
    }

    try {
      return await this.doctorRepository.save(newDoctor);
    } catch (err: unknown) {
      // FIX: Ensure no 'any' types are returned and error is logged
      console.error('Doctor Creation Error:', err);
      const message =
        err instanceof Error ? err.message : 'Database operation failed';

      throw new BadRequestException(
        'Could not create doctor profile. Ensure User ID or BMDC is unique.',
        message,
      );
    }
  }

  async findAllByChamber(chamberId: string): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: {
        chambers: { id: chamberId },
        isActive: true,
      },
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
}
