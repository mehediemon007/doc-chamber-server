import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { MedicalRecord } from './medical-record.entity';

@Entity('patients')
export class Patient {
  @PrimaryColumn() // Use PrimaryColumn, not PrimaryGeneratedColumn
  id: string;

  @Column() // <--- IF THIS LINE IS MISSING, YOU GET THE ERROR
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  bloodGroup: string;

  @Column('simple-array', { nullable: true })
  allergies: string[];

  @OneToMany(() => Booking, (booking) => booking.patient)
  bookings: Booking[];

  @OneToMany(() => MedicalRecord, (record) => record.patient)
  medicalRecords: MedicalRecord[];

  @CreateDateColumn()
  createdAt: Date;
}
