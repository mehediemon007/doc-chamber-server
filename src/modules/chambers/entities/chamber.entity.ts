import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('chambers')
export class Chamber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  location: string;

  @Column()
  startTime: string; // e.g., "05:00 PM"

  @Column({ default: 50 })
  maxPatients: number;

  @Column({ default: 0 })
  currentSerial: number; // The patient currently being seen

  @Column({ default: 0 })
  totalBooked: number; // Total tickets issued today

  @Column({ default: true })
  isBookingOpen: boolean; // The "Relaxation" toggle

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Doctor, (doctor) => doctor.chambers)
  doctor: Doctor;

  @OneToMany(() => Booking, (booking) => booking.chamber)
  bookings: Booking[];
}
