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
import { unlink } from 'fs/promises';
import { join } from 'path';

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

  async deleteMedicalRecord(recordId: string): Promise<void> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // 1. Delete physical files from the 'uploads' folder
    if (record.reportFiles && record.reportFiles.length > 0) {
      for (const filePath of record.reportFiles) {
        try {
          // We use join to get the absolute path
          await unlink(join(process.cwd(), filePath));
        } catch (err) {
          // Log the error but don't stop the process (the file might have been moved or already deleted)
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      }
    }

    // 2. Delete the record from the database
    await this.medicalRecordRepository.remove(record);
  }

  async deleteSpecificFile(
    recordId: string,
    fileName: string,
  ): Promise<{ message: string; updatedAt: Date; remainingFiles: number }> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    const fileIndex = record.reportFiles.findIndex((path) =>
      path.includes(fileName),
    );

    if (fileIndex === -1) {
      throw new NotFoundException('File not found in this record');
    }

    const filePath = record.reportFiles[fileIndex];

    try {
      await unlink(join(process.cwd(), filePath));
    } catch (err) {
      console.error(`Physical file missing: ${filePath}`, err);
    }

    record.reportFiles.splice(fileIndex, 1);

    // Save once and capture the result to get the new updatedAt
    const updatedRecord = await this.medicalRecordRepository.save(record);

    return {
      message: 'File deleted successfully',
      updatedAt: updatedRecord.updatedAt,
      remainingFiles: updatedRecord.reportFiles.length,
    };
  }

  async getPatientHistory(patientId: string) {
    return await this.medicalRecordRepository.find({
      where: { patient: { id: patientId } },
      order: { visitedDate: 'DESC' }, // Show newest records first
    });
  }
}
