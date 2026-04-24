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

@Entity('conversations')
@Unique('UQ_conversations_buyer_producer', ['buyerId', 'producerId'])
export class Conversation {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'buyer_id' })
  buyerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Index()
  @Column({ type: 'uuid', name: 'producer_id' })
  producerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producer_id' })
  producer!: User;

  @Index()
  @Column({ type: 'timestamptz', name: 'last_message_at' })
  lastMessageAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
