import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { TIMESTAMPTZ_TYPE, uuidPrimaryColumn } from '../config/db-types';

export enum PreRegistrationRole {
  PRODUCER = 'producer',
  BUYER = 'buyer',
  UNDECIDED = 'undecided',
}

export enum PreRegistrationStatus {
  /** Email pas encore confirmé par l'utilisateur. */
  PENDING_EMAIL = 'pending_email',
  /** Email confirmé, en attente de revue admin / d'ouverture de l'app. */
  PENDING_REVIEW = 'pending_review',
  /** Admin a contacté la personne. */
  CONTACTED = 'contacted',
  /** Admin a envoyé une invitation (lien d'inscription) à la personne. */
  INVITED = 'invited',
  /** Invitation acceptée : un compte utilisateur a été créé. */
  APPROVED = 'approved',
  /** Refusé par l'admin. */
  REJECTED = 'rejected',
}

@Entity('pre_registrations')
export class PreRegistration {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'enum', enum: PreRegistrationRole })
  role!: PreRegistrationRole;

  @Column({ type: 'varchar', length: 255, name: 'company_name', nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 10, name: 'postal_code', nullable: true })
  postalCode!: string | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'boolean', name: 'consent_rgpd', default: false })
  consentRgpd!: boolean;

  @Column({ type: 'enum', enum: PreRegistrationStatus, default: PreRegistrationStatus.PENDING_EMAIL })
  status!: PreRegistrationStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source!: string | null;

  /** SHA-256 hex (64) du token de confirmation courant, null après usage. */
  @Column({ type: 'varchar', length: 64, name: 'confirmation_token_hash', nullable: true })
  confirmationTokenHash!: string | null;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'confirmation_token_expires_at', nullable: true })
  confirmationTokenExpiresAt!: Date | null;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'email_confirmed_at', nullable: true })
  emailConfirmedAt!: Date | null;

  /** SHA-256 hex du token d'invitation envoyé par un admin (null hors invitation). */
  @Column({ type: 'varchar', length: 64, name: 'invite_token_hash', nullable: true })
  inviteTokenHash!: string | null;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'invite_token_expires_at', nullable: true })
  inviteTokenExpiresAt!: Date | null;

  @Column({ type: TIMESTAMPTZ_TYPE, name: 'invited_at', nullable: true })
  invitedAt!: Date | null;

  /** Date d'acceptation de l'invitation (passage à un compte utilisateur réel). */
  @Column({ type: TIMESTAMPTZ_TYPE, name: 'accepted_at', nullable: true })
  acceptedAt!: Date | null;

  /** ID utilisateur créé après acceptation de l'invitation. */
  @Column({ type: 'varchar', length: 36, name: 'accepted_user_id', nullable: true })
  acceptedUserId!: string | null;

  @Column({ type: 'varchar', length: 45, name: 'created_ip', nullable: true })
  createdIp!: string | null;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMPTZ_TYPE })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMPTZ_TYPE })
  updatedAt!: Date;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
