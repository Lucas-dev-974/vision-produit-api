import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { TIMESTAMPTZ_TYPE, uuidColumn, uuidPrimaryColumn } from '../config/db-types';

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ALTERNATIVE_PROPOSED = 'alternative_proposed',
  CONFIRMED = 'confirmed',
  HONORED = 'honored',
  NOT_HONORED = 'not_honored',
  CANCELLED = 'cancelled',
  REFUSED = 'refused',
}

@Entity('orders')
export class Order {
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

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status_enum',
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: 'date', name: 'retrieval_date' })
  retrievalDate!: string;

  @Column({ type: 'varchar', length: 50, name: 'retrieval_time_slot', nullable: true })
  retrievalTimeSlot!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  cancellationReason!: string | null;

  @Column({ type: 'text', name: 'refusal_reason', nullable: true })
  refusalReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMPTZ_TYPE })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMPTZ_TYPE })
  updatedAt!: Date;

  /**
   * Legacy : conservé en base, non utilisé pour le comptage des pastilles.
   * Voir notifRevision / *NotifRevisionAck.
   */
  @Column({ type: TIMESTAMPTZ_TYPE, name: 'buyer_seen_at', nullable: true })
  buyerSeenAt!: Date | null;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'producer_seen_at', nullable: true })
  producerSeenAt!: Date | null;

  /**
   * Incrémenté sur chaque changement d'état (ou d’autres événements métier) de la commande
   * pour alimenter les pastilles, indépendamment de updatedAt.
   */
  @Column({ type: 'int', name: 'notif_revision', default: 1 })
  notifRevision!: number;

  /** Dernier notifRevision pris en compte par l’acheteur (à jour côté pastilles). */
  @Column({ type: 'int', name: 'buyer_notif_ack', default: 1 })
  buyerNotifRevisionAck!: number;

  @Column({ type: 'int', name: 'producer_notif_ack', default: 1 })
  producerNotifRevisionAck!: number;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
