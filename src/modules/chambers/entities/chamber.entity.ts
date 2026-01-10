import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
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

  // --- STATIC LOCATION (The Fixed Destination) ---
  // Using 'lat' and 'lng' to match your controller's access: targetChamber.lat
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

  @Column({ default: 0 })
  delayMinutes: number;

  // These represent the doctor's current position if tracked at chamber level
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

  // Relationship with Doctors
  @ManyToMany(() => Doctor, (doctor) => doctor.chambers)
  doctors: Doctor[];

  // Relationship with Staff/Users
  @OneToMany(() => User, (user) => user.chamber)
  members: User[];

  // Relationship with Appointments
  @OneToMany(() => Booking, (booking) => booking.chamber)
  bookings: Booking[];
}
