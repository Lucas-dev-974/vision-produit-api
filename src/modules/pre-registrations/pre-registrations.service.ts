import { createHash, randomBytes } from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import {
  PreRegistration,
  PreRegistrationRole,
  PreRegistrationStatus,
} from '../../entities/pre-registration.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { AdminAuditTargetType } from '../../entities/admin-audit-log.entity';
import {
  sendPreRegistrationAdminNotification,
  sendPreRegistrationConfirmationEmail,
  sendPreRegistrationInvitationEmail,
} from '../../lib/email';
import { adminAuditService } from '../admin/admin-audit.service';

const CONFIRMATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Réponse publique : on ne fuit jamais le statut d'un email autre que celui en cours. */
export interface PreRegistrationPublicResult {
  status: 'created' | 'already_pending' | 'already_confirmed';
}

export interface PreRegistrationAdminDto {
  id: string;
  email: string;
  role: PreRegistrationRole;
  companyName: string | null;
  siret: string | null;
  phone: string | null;
  city: string | null;
  postalCode: string | null;
  message: string | null;
  consentRgpd: boolean;
  status: PreRegistrationStatus;
  source: string | null;
  emailConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function toAdminDto(p: PreRegistration): PreRegistrationAdminDto {
  return {
    id: p.id,
    email: p.email,
    role: p.role,
    companyName: p.companyName,
    siret: p.siret,
    phone: p.phone,
    city: p.city,
    postalCode: p.postalCode,
    message: p.message,
    consentRgpd: p.consentRgpd,
    status: p.status,
    source: p.source,
    emailConfirmedAt: p.emailConfirmedAt ? p.emailConfirmedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function generateConfirmationToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);
  return { token, tokenHash, expiresAt };
}

function normalizeOptional(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const preRegistrationsService = {
  async create(input: {
    email: string;
    role: PreRegistrationRole;
    companyName?: string;
    siret?: string;
    phone?: string;
    city?: string;
    postalCode?: string;
    message?: string;
    source?: string;
    consentRgpd: true;
    ip?: string;
  }): Promise<PreRegistrationPublicResult> {
    const repo = AppDataSource.getRepository(PreRegistration);
    const userRepo = AppDataSource.getRepository(User);

    const email = input.email.toLowerCase();

    // Si un compte utilisateur existe déjà avec cet email, on ne déborde pas
    // d'information (réponse neutre) et on n'envoie rien.
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser && existingUser.status !== UserStatus.DELETED) {
      return { status: 'already_confirmed' };
    }

    const existing = await repo.findOne({ where: { email } });

    if (existing) {
      if (existing.emailConfirmedAt) {
        return { status: 'already_confirmed' };
      }
      // Re-génère un token et renvoie l'email — comportement idempotent.
      const { token, tokenHash, expiresAt } = generateConfirmationToken();
      existing.confirmationTokenHash = tokenHash;
      existing.confirmationTokenExpiresAt = expiresAt;
      // On met à jour les infos secondaires si elles ont changé.
      existing.role = input.role;
      existing.companyName = normalizeOptional(input.companyName);
      existing.siret = normalizeOptional(input.siret);
      existing.phone = normalizeOptional(input.phone);
      existing.city = normalizeOptional(input.city);
      existing.postalCode = normalizeOptional(input.postalCode);
      existing.message = normalizeOptional(input.message);
      existing.source = normalizeOptional(input.source) ?? existing.source;
      existing.consentRgpd = true;
      existing.createdIp = input.ip ?? existing.createdIp;
      await repo.save(existing);
      await sendPreRegistrationConfirmationEmail(email, token);
      return { status: 'already_pending' };
    }

    const { token, tokenHash, expiresAt } = generateConfirmationToken();

    const entity = repo.create({
      email,
      role: input.role,
      companyName: normalizeOptional(input.companyName),
      siret: normalizeOptional(input.siret),
      phone: normalizeOptional(input.phone),
      city: normalizeOptional(input.city),
      postalCode: normalizeOptional(input.postalCode),
      message: normalizeOptional(input.message),
      consentRgpd: true,
      status: PreRegistrationStatus.PENDING_EMAIL,
      source: normalizeOptional(input.source),
      confirmationTokenHash: tokenHash,
      confirmationTokenExpiresAt: expiresAt,
      emailConfirmedAt: null,
      createdIp: input.ip ?? null,
    });

    await repo.save(entity);
    await sendPreRegistrationConfirmationEmail(email, token);
    return { status: 'created' };
  },

  async confirm(token: string): Promise<{ email: string; alreadyConfirmed: boolean }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const repo = AppDataSource.getRepository(PreRegistration);

    const row = await repo.findOne({ where: { confirmationTokenHash: tokenHash } });
    if (!row) {
      throw new AppError('NOT_FOUND', 'Lien de confirmation invalide ou déjà utilisé', 404);
    }

    if (
      !row.confirmationTokenExpiresAt ||
      row.confirmationTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new AppError('VALIDATION_ERROR', 'Lien de confirmation expiré', 400);
    }

    if (row.emailConfirmedAt) {
      // Cas peu probable (tokenHash devrait être null), mais on le couvre.
      return { email: row.email, alreadyConfirmed: true };
    }

    row.emailConfirmedAt = new Date();
    row.status = PreRegistrationStatus.PENDING_REVIEW;
    row.confirmationTokenHash = null;
    row.confirmationTokenExpiresAt = null;
    await repo.save(row);

    await sendPreRegistrationAdminNotification({
      email: row.email,
      role: row.role,
      companyName: row.companyName,
      city: row.city,
    });

    return { email: row.email, alreadyConfirmed: false };
  },

  async resend(email: string): Promise<{ status: 'sent' | 'already_confirmed' | 'unknown' }> {
    const repo = AppDataSource.getRepository(PreRegistration);
    const row = await repo.findOne({ where: { email: email.toLowerCase() } });
    if (!row) {
      // Réponse neutre côté contrôleur : on évite l'énumération.
      return { status: 'unknown' };
    }
    if (row.emailConfirmedAt) {
      return { status: 'already_confirmed' };
    }
    const { token, tokenHash, expiresAt } = generateConfirmationToken();
    row.confirmationTokenHash = tokenHash;
    row.confirmationTokenExpiresAt = expiresAt;
    await repo.save(row);
    await sendPreRegistrationConfirmationEmail(row.email, token);
    return { status: 'sent' };
  },

  async listForAdmin(
    page: number,
    pageSize: number,
    status?: PreRegistrationStatus,
  ): Promise<{ items: PreRegistrationAdminDto[]; total: number }> {
    const repo = AppDataSource.getRepository(PreRegistration);
    const qb = repo.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
    if (status) {
      qb.andWhere('p.status = :status', { status });
    }
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
    return { items: items.map(toAdminDto), total };
  },

  async updateStatus(
    adminId: string,
    id: string,
    status: PreRegistrationStatus,
  ): Promise<PreRegistrationAdminDto> {
    const repo = AppDataSource.getRepository(PreRegistration);
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      throw new AppError('NOT_FOUND', 'Pré-inscription introuvable', 404);
    }
    row.status = status;
    await repo.save(row);
    await adminAuditService.record({
      adminId,
      action: 'pre_registration.update_status',
      targetType: AdminAuditTargetType.PRE_REGISTRATION,
      targetId: id,
      payload: { status },
    });
    return toAdminDto(row);
  },

  async invite(
    adminId: string,
    id: string,
    customMessage: string | null,
  ): Promise<PreRegistrationAdminDto> {
    const repo = AppDataSource.getRepository(PreRegistration);
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      throw new AppError('NOT_FOUND', 'Pré-inscription introuvable', 404);
    }
    if (row.status === PreRegistrationStatus.APPROVED && row.acceptedUserId) {
      throw new AppError(
        'CONFLICT',
        'Cette pré-inscription a déjà été convertie en compte',
        409,
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    row.inviteTokenHash = tokenHash;
    row.inviteTokenExpiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    row.invitedAt = new Date();
    row.status = PreRegistrationStatus.INVITED;
    await repo.save(row);

    await sendPreRegistrationInvitationEmail(row.email, token, customMessage);
    await adminAuditService.record({
      adminId,
      action: 'pre_registration.invite',
      targetType: AdminAuditTargetType.PRE_REGISTRATION,
      targetId: id,
      payload: { hasMessage: !!customMessage },
    });

    return toAdminDto(row);
  },

  /**
   * Validation publique d'un token d'invitation : renvoie les infos prefill
   * (email, rôle, entreprise, SIRET) ou une erreur si le token est invalide.
   */
  async validateInvitation(token: string): Promise<{
    email: string;
    role: PreRegistrationRole;
    companyName: string | null;
    siret: string | null;
    city: string | null;
    postalCode: string | null;
  }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const repo = AppDataSource.getRepository(PreRegistration);
    const row = await repo.findOne({ where: { inviteTokenHash: tokenHash } });

    if (!row) {
      throw new AppError('NOT_FOUND', 'Lien d\u2019invitation invalide', 404);
    }
    if (
      !row.inviteTokenExpiresAt ||
      row.inviteTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new AppError('VALIDATION_ERROR', 'Lien d\u2019invitation expiré', 400);
    }
    if (row.acceptedUserId) {
      throw new AppError(
        'CONFLICT',
        'Cette invitation a déjà été utilisée',
        409,
      );
    }

    return {
      email: row.email,
      role: row.role,
      companyName: row.companyName,
      siret: row.siret,
      city: row.city,
      postalCode: row.postalCode,
    };
  },

  /** Marque l'invitation comme utilisée (appelé par le service d'auth après création du compte). */
  async markInvitationAccepted(token: string, userId: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const repo = AppDataSource.getRepository(PreRegistration);
    const row = await repo.findOne({ where: { inviteTokenHash: tokenHash } });
    if (!row) return;
    row.inviteTokenHash = null;
    row.inviteTokenExpiresAt = null;
    row.acceptedAt = new Date();
    row.acceptedUserId = userId;
    row.status = PreRegistrationStatus.APPROVED;
    await repo.save(row);
  },
};
