import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Chamber } from '../../chambers/entities/chamber.entity'; // Import Chamber

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  specialty: string; // e.g., Cardiologist, Pediatrician

  @Column({ unique: true })
  bmdcRegistration: string; // Bangladesh Medical & Dental Council reg number

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isPrivate: boolean; // TRUE = Doctor's own chamber (Manage Serials), FALSE = External Clinic (View only)

  @OneToMany(() => Chamber, (chamber) => chamber.doctor)
  chambers: Chamber[];

  @Column({ nullable: true })
  externalSoftwareLink: string; // Optional: A place to put a link to the clinic's software

  @CreateDateColumn()
  createdAt: Date;
}
