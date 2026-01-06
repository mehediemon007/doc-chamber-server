import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async signup(dto: SignupDto) {
    // 1. Check if patient already exists
    const existingPatient = await this.patientRepository.findOne({
      where: { phone: dto.phone },
    });

    if (existingPatient) {
      throw new ConflictException('This phone number is already registered');
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create and Save
    const newPatient = this.patientRepository.create({
      fullName: dto.fullName,
      phone: dto.phone,
      password: hashedPassword,
    });

    const savedPatient = await this.patientRepository.save(newPatient);

    // 4. Return user without password
    // This creates a new object 'patientData' containing everything EXCEPT the password
    return {
      ...savedPatient,
      password: undefined,
    };
  }

  // Add this inside the PatientsService class
  async findOneByPhone(phone: string): Promise<Patient | null> {
    return await this.patientRepository
      .createQueryBuilder('patient')
      .addSelect('patient.password') // This allows us to see the hashed password for comparison
      .where('patient.phone = :phone', { phone })
      .getOne();
  }
}
