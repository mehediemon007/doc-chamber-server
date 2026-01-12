import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('subscription_tokens')
export class SubscriptionToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tokenValue: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  usedByPhone: string;

  @CreateDateColumn()
  createdAt: Date;
}
