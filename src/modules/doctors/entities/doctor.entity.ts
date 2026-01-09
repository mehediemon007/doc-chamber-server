import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chamber } from '../../chambers/entities/chamber.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column({ unique: true })
  bmdcRegistration: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => User, (user) => user.doctorProfile)
  @JoinColumn()
  user: User;

  @ManyToMany(() => Chamber, (chamber) => chamber.doctors)
  @JoinTable({ name: 'doctor_chambers' })
  chambers: Chamber[];

  @CreateDateColumn()
  createdAt: Date;
}
