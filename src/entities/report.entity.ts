import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { Message } from './message.entity';
import { TIMESTAMPTZ_TYPE, uuidColumn, uuidPrimaryColumn } from '../config/db-types';

export enum ReportCategory {
  FAKE_PROFILE = 'fake_profile',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SCAM = 'scam',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

export enum ReportStatus {
  OPEN = 'open',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @Column(uuidColumn({ name: 'reporter_id' }))
  reporterId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @Index()
  @Column(uuidColumn({ name: 'target_user_id', nullable: true }))
  targetUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User | null;

  @Column(uuidColumn({ name: 'target_message_id', nullable: true }))
  targetMessageId!: string | null;

  @ManyToOne(() => Message, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'target_message_id' })
  targetMessage!: Message | null;

  @Column({
    type: 'enum',
    enum: ReportCategory,
    enumName: 'report_category_enum',
  })
  category!: ReportCategory;

  @Column({ type: 'text' })
  description!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ReportStatus,
    enumName: 'report_status_enum',
    default: ReportStatus.OPEN,
  })
  status!: ReportStatus;

  @Column({ type: 'text', name: 'admin_notes', nullable: true })
  adminNotes!: string | null;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'resolved_at', nullable: true })
  resolvedAt!: Date | null;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
