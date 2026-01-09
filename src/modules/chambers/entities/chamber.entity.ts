import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany, // Use ManyToMany
  CreateDateColumn,
} from 'typeorm';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

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
  currentLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLng: number;

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

  // FIX: Change to ManyToMany and rename to 'doctors' (plural)
  // This matches the (chamber) => chamber.doctors in your Doctor entity
  @ManyToMany(() => Doctor, (doctor) => doctor.chambers)
  doctors: Doctor[];

  // Note: Using string 'User' is fine, but using () => User is better for typing
  @OneToMany(() => User, (user) => user.chamber)
  members: User[];

  @OneToMany(() => Booking, (booking) => booking.chamber)
  bookings: Booking[];
}
