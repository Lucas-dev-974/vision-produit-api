import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { TIMESTAMPTZ_TYPE, uuidColumn, uuidPrimaryColumn } from '../config/db-types';

@Entity('messages')
export class Message {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @Index()
  @Column(uuidColumn({ name: 'conversation_id' }))
  conversationId!: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column(uuidColumn({ name: 'sender_id' }))
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ type: 'varchar', length: 2000 })
  content!: string;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'read_at', nullable: true })
  readAt!: Date | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: TIMESTAMPTZ_TYPE })
  createdAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
