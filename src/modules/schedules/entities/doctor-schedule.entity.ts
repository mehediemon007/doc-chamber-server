// src/schedules/entities/doctor-schedule.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Chamber } from '../../chambers/entities/chamber.entity';

@Entity('doctor_schedules')
export class DoctorSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  })
  dayOfWeek: string;

  @Column()
  shiftName: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: 20 })
  maxPatients: number;

  @ManyToOne(() => User, (user) => user.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @ManyToOne(() => Chamber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chamberId' })
  chamber: Chamber;
}
