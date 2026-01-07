import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Chamber } from 'src/modules/chambers/entities/chamber.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serialNumber: number; // The ticket number (1, 2, 3...)

  @Column({ type: 'date' })
  bookingDate: string; // The date they are visiting

  @Column({ default: 'pending' })
  status: string; // pending, completed, cancelled

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Patient, (patient) => patient.id)
  patient: Patient;

  @ManyToOne(() => Chamber, (chamber) => chamber.id)
  chamber: Chamber;
}
