import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { User } from '../../users/entities/user.entity'; // Use 'import type'

@Entity('chambers')
export class Chamber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Use a string 'User' here as well
  @OneToMany('User', 'chamber')
  members: User[];
}
