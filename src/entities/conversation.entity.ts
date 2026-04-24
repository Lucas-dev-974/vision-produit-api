import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
  Unique,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { TIMESTAMPTZ_TYPE, uuidColumn, uuidPrimaryColumn } from '../config/db-types';

@Entity('conversations')
@Unique('UQ_conversations_buyer_producer', ['buyerId', 'producerId'])
export class Conversation {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @Index()
  @Column(uuidColumn({ name: 'buyer_id' }))
  buyerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Index()
  @Column(uuidColumn({ name: 'producer_id' }))
  producerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producer_id' })
  producer!: User;

  @Index()
  @Column({ type: TIMESTAMPTZ_TYPE, name: 'last_message_at' })
  lastMessageAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
