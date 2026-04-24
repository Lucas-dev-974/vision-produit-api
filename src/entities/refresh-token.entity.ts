import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { TIMESTAMPTZ_TYPE, uuidColumn } from '../config/db-types';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn(uuidColumn())
  id!: string;

  @Column(uuidColumn({ name: 'user_id' }))
  userId!: string;

  @Column({ type: 'varchar', length: 64, name: 'token_hash' })
  tokenHash!: string;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  revoked!: boolean;

  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 512, name: 'user_agent', nullable: true })
  userAgent!: string | null;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
