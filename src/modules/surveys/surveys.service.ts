import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import {
  SurveyResponse,
  SurveyRespondentRole,
  SurveyResponseStatus,
} from '../../entities/survey-response.entity';

export interface SurveyResponseAdminDto {
  id: string;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string;
  role: SurveyRespondentRole;
  activityType: string | null;
  zone: string | null;
  sizeBracket: string | null;
  answers: Record<string, unknown>;
  consentRgpd: boolean;
  consentRecontact: boolean;
  status: SurveyResponseStatus;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

function toAdminDto(s: SurveyResponse): SurveyResponseAdminDto {
  return {
    id: s.id,
    contactName: s.contactName,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    role: s.role,
    activityType: s.activityType,
    zone: s.zone,
    sizeBracket: s.sizeBracket,
    answers: s.answers ?? {},
    consentRgpd: s.consentRgpd,
    consentRecontact: s.consentRecontact,
    status: s.status,
    source: s.source,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function normalizeOptional(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Normalise les zones choisies en chaîne stockée : `all` seul, ou codes triés uniques. */
function normalizeZoneStorage(zones: string[] | undefined): string | null {
  if (!zones || zones.length === 0) return null;
  const unique = [...new Set(zones)];
  if (unique.includes('all')) return 'all';
  return unique.sort().join(',');
}

export const surveysService = {
  async create(input: {
    contactName?: string;
    contactEmail: string;
    contactPhone: string;
    role: SurveyRespondentRole;
    activityType?: string;
    zone?: string[];
    sizeBracket?: string;
    answers: Record<string, unknown>;
    consentRgpd: true;
    consentRecontact?: boolean;
    source?: string;
    ip?: string;
  }): Promise<{ id: string }> {
    const repo = AppDataSource.getRepository(SurveyResponse);

    const entity = repo.create({
      contactName: normalizeOptional(input.contactName),
      contactEmail: input.contactEmail.toLowerCase(),
      contactPhone: input.contactPhone.trim(),
      role: input.role,
      activityType: normalizeOptional(input.activityType),
      zone: normalizeZoneStorage(input.zone),
      sizeBracket: normalizeOptional(input.sizeBracket),
      answers: input.answers ?? {},
      consentRgpd: true,
      consentRecontact: !!input.consentRecontact,
      status: SurveyResponseStatus.NEW,
      source: normalizeOptional(input.source),
      createdIp: input.ip ?? null,
    });

    await repo.save(entity);
    return { id: entity.id };
  },

  async listForAdmin(
    page: number,
    pageSize: number,
    filters: {
      status?: SurveyResponseStatus;
      role?: SurveyRespondentRole;
    } = {},
  ): Promise<{ items: SurveyResponseAdminDto[]; total: number }> {
    const repo = AppDataSource.getRepository(SurveyResponse);
    const qb = repo.createQueryBuilder('s').orderBy('s.createdAt', 'DESC');
    if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
    if (filters.role) qb.andWhere('s.role = :role', { role: filters.role });
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
    return { items: items.map(toAdminDto), total };
  },

  async getForAdmin(id: string): Promise<SurveyResponseAdminDto> {
    const repo = AppDataSource.getRepository(SurveyResponse);
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      throw new AppError('NOT_FOUND', 'Réponse de questionnaire introuvable', 404);
    }
    return toAdminDto(row);
  },

  async updateStatus(
    id: string,
    status: SurveyResponseStatus,
  ): Promise<SurveyResponseAdminDto> {
    const repo = AppDataSource.getRepository(SurveyResponse);
    const row = await repo.findOne({ where: { id } });
    if (!row) {
      throw new AppError('NOT_FOUND', 'Réponse de questionnaire introuvable', 404);
    }
    row.status = status;
    await repo.save(row);
    return toAdminDto(row);
  },

  async delete(id: string): Promise<void> {
    const repo = AppDataSource.getRepository(SurveyResponse);
    const result = await repo.delete({ id });
    if (!result.affected) {
      throw new AppError('NOT_FOUND', 'Réponse de questionnaire introuvable', 404);
    }
  },
};
