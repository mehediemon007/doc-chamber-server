import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { MedicalRecord } from './medical-record.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid') // <--- This will fix the 500 error
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

  // This link stays, but it will be NULL for guests until they register
  @OneToOne(() => User, (user) => user.patient, { nullable: true })
  @JoinColumn() // This will automatically create a 'userId' column
  user?: User;
}
