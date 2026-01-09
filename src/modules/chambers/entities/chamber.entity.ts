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
import { User } from '../../users/entities/user.entity';

// Define status for the live tracking logic
export enum DoctorTravelStatus {
  AT_HOME = 'at_home',
  ON_THE_WAY = 'on_the_way',
  IN_CHAMBER = 'in_chamber',
  DELAYED = 'delayed',
}

@Entity('chambers')
export class Chamber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  // --- STATIC LOCATION (The Destination) ---
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  lat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  lng: number;

  // --- LIVE TRACKING FIELDS ---
  @Column({
    type: 'enum',
    enum: DoctorTravelStatus,
    default: DoctorTravelStatus.AT_HOME,
  })
  travelStatus: DoctorTravelStatus;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLat: number; // Updated live as the doctor moves

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLng: number; // Updated live as the doctor moves

  @Column({ nullable: true })
  estimatedArrivalTime: Date;

  @Column({ nullable: true })
  startTime: string;

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

  @ManyToOne(() => Doctor, (doctor) => doctor.chambers)
  doctor: Doctor;

  @OneToMany('User', 'chamber')
  members: User[];

  @OneToMany(() => Booking, (booking) => booking.chamber)
  bookings: Booking[];
}
