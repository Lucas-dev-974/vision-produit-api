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
import {
  JSON_TYPE,
  TIMESTAMPTZ_TYPE,
  uuidColumn,
  uuidPrimaryColumn,
} from '../config/db-types';

/**
 * Catégories de cibles auditables. Sert à filtrer côté admin.
 */
export enum AdminAuditTargetType {
  USER = 'user',
  PRE_REGISTRATION = 'pre_registration',
  REPORT = 'report',
  SYSTEM = 'system',
}

/**
 * Journal d'actions sensibles effectuées via le back-office admin.
 * Conserve l'auteur, la cible, l'action et un payload arbitraire (JSON).
 */
@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  /** Admin auteur de l'action. Peut être null si l'action est issue d'un seed/système. */
  @Index()
  @Column(uuidColumn({ name: 'admin_id', nullable: true }))
  adminId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin!: User | null;

  /** Action courte, ex. `user.approve`, `report.resolve`, `pre_registration.invite`. */
  @Index()
  @Column({ type: 'varchar', length: 64 })
  action!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: AdminAuditTargetType,
    enumName: 'admin_audit_target_enum',
    name: 'target_type',
  })
  targetType!: AdminAuditTargetType;

  /** ID de la cible (user, pre-registration, report, …). Null si cible globale (system). */
  @Column(uuidColumn({ name: 'target_id', nullable: true }))
  targetId!: string | null;

  @Column({ type: JSON_TYPE, nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMPTZ_TYPE })
  createdAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
