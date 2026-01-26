import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany, // Added this import
} from 'typeorm';
import { Role } from '../../auth/enums/role.enum';
import { Chamber } from '../../chambers/entities/chamber.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import { DoctorSchedule } from '../../schedules/entities/doctor-schedule.entity'; // Adjust this path!

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.PATIENT })
  role: Role;

  @Column({ nullable: true })
  licenseNumber?: string;

  @Column({ nullable: true })
  specialization?: string; // Helpful for your filtered discovery

  @ManyToOne(() => Chamber, (chamber) => chamber.members, { nullable: true })
  chamber: Chamber;

  @OneToOne(() => Doctor, (doctor) => doctor.user, { nullable: true })
  doctorProfile?: Doctor;

  @OneToOne(() => Patient, (patient) => patient.user)
  patient?: Patient;

  // This link allows the Admin to see all shifts assigned to a specific Doctor
  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor)
  schedules: DoctorSchedule[];
}
