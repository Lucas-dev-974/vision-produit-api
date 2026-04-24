import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { TIMESTAMPTZ_TYPE, uuidColumn } from '../config/db-types';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryColumn(uuidColumn())
  id!: string;

  @Column(uuidColumn({ name: 'user_id' }))
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 64, name: 'token_hash' })
  tokenHash!: string;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'used_at', nullable: true })
  usedAt!: Date | null;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
