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

  @Column({ nullable: true })
  specialty: string;

  @Column({ unique: true, nullable: true })
  bmdcRegistration: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  hasJoinedPlatform: boolean; // Scenario 1: false, Scenario 2: true

  @OneToOne(() => User, (user) => user.doctorProfile, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  user?: User;

  @ManyToMany(() => Chamber, (chamber) => chamber.doctors)
  @JoinTable({ name: 'doctor_chambers' })
  chambers: Chamber[];

  @CreateDateColumn()
  createdAt: Date;
}
