import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  medicalIssue: string; // e.g., "High fever and dry cough"

  @Column('text', { nullable: true })
  diagnosis: string; // e.g., "Viral Infection"

  @Column('text', { nullable: true })
  prescription: string; // e.g., "Paracetamol 500mg, 1-0-1"

  @Column('simple-array', { nullable: true })
  reportFiles: string[]; // URLs for uploaded PDFs or Photos

  @CreateDateColumn()
  visitedDate: Date;

  @Column({ default: 'doctor' })
  authorRole: 'doctor' | 'patient' | 'staff';

  @Column({ nullable: true })
  authorId: string; // ID of the person who uploaded it

  // Link back to the Patient
  @ManyToOne(() => Patient, (patient) => patient.medicalRecords)
  patient: Patient;
}
