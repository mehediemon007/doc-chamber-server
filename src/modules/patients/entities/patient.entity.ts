import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany, // <--- Add this
} from 'typeorm';
import { MedicalRecord } from './medical-record.entity'; // We will create this next

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  // --- NEW FIELDS FOR MEDICAL CONTEXT ---
  @Column({ nullable: true })
  bloodGroup: string;

  @Column('simple-array', { nullable: true })
  allergies: string[];

  // RELATIONSHIP: Link to the new MedicalRecord table
  @OneToMany(() => MedicalRecord, (record) => record.patient)
  medicalRecords: MedicalRecord[];

  @CreateDateColumn()
  createdAt: Date;
}
