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
import { User } from '../../users/entities/user.entity'; // Import User entity

@Entity('chambers')
export class Chamber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Added this to fix the "Property name does not exist" error
  @Column()
  name: string;

  @Column({ nullable: true }) // Changed to nullable if not provided at setup
  location: string;

  @Column({ nullable: true })
  startTime: string; // e.g., "05:00 PM"

  @Column({ default: 50 })
  maxPatients: number;

  @Column({ default: 0 })
  currentSerial: number;

  @Column({ default: 0 })
  totalBooked: number;

  @Column({ default: true })
  isBookingOpen: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationship to the Doctor profile (Specific professional info)
  @ManyToOne(() => Doctor, (doctor) => doctor.chambers)
  doctor: Doctor;

  // Relationship to all Users (Admin, Staff, Doctors) belonging to this chamber
  @OneToMany('User', 'chamber')
  members: User[];

  @OneToMany(() => Booking, (booking) => booking.chamber)
  bookings: Booking[];
}
