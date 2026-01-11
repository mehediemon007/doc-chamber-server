import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { MedicalRecordsController } from './medical-records.controller';
import { Patient } from './entities/patient.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, MedicalRecord]), CommonModule],
  controllers: [PatientsController, MedicalRecordsController],
  providers: [PatientsService],
  exports: [PatientsService], // Export if you need it in Auth module later
})
export class PatientsModule {}
