import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  create(createDoctorDto: CreateDoctorDto) {
    const newDoctor = this.doctorRepository.create(createDoctorDto);
    return this.doctorRepository.save(newDoctor);
  }

  findAll() {
    return this.doctorRepository.find({ where: { isActive: true } });
  }
}
