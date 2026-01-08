import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { SignupDto } from './dto/signup.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
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

  async addMedicalRecord(
    dto: CreateMedicalRecordDto,
    authorRole: string,
    authorId: string,
  ): Promise<MedicalRecord> {
    // Added explicit return type
    // 1. SECURITY CHECK
    if (authorRole === 'patient' && authorId !== dto.patientId) {
      throw new ForbiddenException('You can only upload records for yourself.');
    }

    // 2. DATABASE CHECK
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patientId },
    });

    // Strict check for null/undefined
    if (patient === null || patient === undefined) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    // 3. CREATE RECORD
    const record = this.medicalRecordRepository.create({
      ...dto,
      patient: patient,
    });

    return await this.medicalRecordRepository.save(record);
  }

  async getPatientHistory(patientId: string) {
    return await this.medicalRecordRepository.find({
      where: { patient: { id: patientId } },
      order: { visitedDate: 'DESC' }, // Show newest records first
    });
  }
}
