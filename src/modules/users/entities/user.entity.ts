import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from '../../auth/enums/role.enum';
import { Chamber } from '../../chambers/entities/chamber.entity';

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
}
