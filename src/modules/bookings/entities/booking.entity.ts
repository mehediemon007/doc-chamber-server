import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Chamber } from '../../chambers/entities/chamber.entity';

@Entity('bookings')
// This Index ensures that a Serial Number is unique for a specific Chamber on a specific Date
@Index(['serialNumber', 'bookingDate', 'chamber'], { unique: true })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serialNumber: number; // The ticket number (1, 2, 3...)

  @Column({ type: 'date' })
  bookingDate: string; // The date they are visiting (YYYY-MM-DD)

  @Column({ default: 'pending' })
  status: string; // pending, completed, cancelled, or no-show

  @CreateDateColumn()
  createdAt: Date;

  // Relationship to the Patient (The person who owns the ticket)
  @ManyToOne(() => Patient, (patient) => patient.id, { onDelete: 'CASCADE' })
  patient: Patient;

  // Relationship to the Chamber (Where the appointment happens)
  // We use a string for the target to avoid potential circular dependency issues
  @ManyToOne('Chamber', 'bookings', { onDelete: 'CASCADE' })
  chamber: Chamber;
}
