import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('patients') // This creates a table named 'patients' in Postgres
export class Patient {
  @PrimaryGeneratedColumn('uuid') // Uses UUIDs for better security/scalability
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false }) // Password won't be sent back in API responses
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
