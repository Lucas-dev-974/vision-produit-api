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
import { JSON_TYPE, TIMESTAMPTZ_TYPE, uuidPrimaryColumn } from '../config/db-types';

export enum SurveyRespondentRole {
  PRODUCER = 'producer',
  MERCHANT = 'merchant',
  BOTH = 'both',
}

export enum SurveyResponseStatus {
  /** Réponse fraîchement reçue, jamais consultée par un admin. */
  NEW = 'new',
  /** Lue / examinée par un admin. */
  REVIEWED = 'reviewed',
  /** Archivée (traitée, plus actionnable). */
  ARCHIVED = 'archived',
}

/**
 * Réponse au questionnaire « pitch » destiné aux producteurs / commerçants.
 *
 * Les réponses détaillées sont stockées dans `answers` (JSON) afin de pouvoir
 * faire évoluer le questionnaire sans migration SQL à chaque ajout de question.
 * Les méta-données fréquemment filtrées (rôle, zone, taille, statut, contact)
 * restent en colonnes dédiées pour faciliter le tri/filtre côté admin.
 */
@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryColumn(uuidPrimaryColumn())
  id!: string;

  @Column({ type: 'varchar', length: 120, name: 'contact_name', nullable: true })
  contactName!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255, name: 'contact_email' })
  contactEmail!: string;

  @Column({ type: 'varchar', length: 30, name: 'contact_phone' })
  contactPhone!: string;

  @Index()
  @Column({ type: 'enum', enum: SurveyRespondentRole, enumName: 'survey_respondent_role_enum' })
  role!: SurveyRespondentRole;

  @Column({ type: 'varchar', length: 120, name: 'activity_type', nullable: true })
  activityType!: string | null;

  /** Codes géo séparés par des virgules, ou `all` seul (toute La Réunion). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  zone!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'size_bracket', nullable: true })
  sizeBracket!: string | null;

  /** Toutes les réponses du questionnaire, structurées par section. */
  @Column({ type: JSON_TYPE })
  answers!: Record<string, unknown>;

  @Column({ type: 'boolean', name: 'consent_rgpd', default: false })
  consentRgpd!: boolean;

  @Column({ type: 'boolean', name: 'consent_recontact', default: false })
  consentRecontact!: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: SurveyResponseStatus,
    enumName: 'survey_response_status_enum',
    default: SurveyResponseStatus.NEW,
  })
  status!: SurveyResponseStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source!: string | null;

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
