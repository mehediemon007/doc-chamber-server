import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Role } from '../../auth/enums/role.enum';
import { Chamber } from '../../chambers/entities/chamber.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.PATIENT })
  role: Role;

  // Add this field to fix the "Property does not exist" error
  @Column({ nullable: true })
  licenseNumber?: string;

  @ManyToOne(() => Chamber, (chamber) => chamber.members, { nullable: true })
  chamber: Chamber;

  // This bi-directional link allows you to do: user.doctorProfile
  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctorProfile: Doctor;
}
