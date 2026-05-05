import { AppDataSource } from '../../config/data-source';
import { AppError } from '../../common/errors/app-error';
import { Report, ReportCategory, ReportStatus } from '../../entities/report.entity';
import { Message } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';
import { AdminAuditTargetType } from '../../entities/admin-audit-log.entity';
import { adminAuditService } from './admin-audit.service';

export interface AdminReportListItem {
  id: string;
  reporterId: string;
  reporterEmail: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetMessageId: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminReportDetail extends AdminReportListItem {
  targetMessageContent: string | null;
}

export const adminReportsService = {
  async list(filters: {
    page: number;
    pageSize: number;
    status?: ReportStatus;
    category?: ReportCategory;
  }): Promise<{ items: AdminReportListItem[]; total: number }> {
    const repo = AppDataSource.getRepository(Report);
    const qb = repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reporter', 'reporter')
      .leftJoinAndSelect('r.targetUser', 'targetUser')
      .orderBy('r.createdAt', 'DESC');

    if (filters.status) qb.andWhere('r.status = :status', { status: filters.status });
    if (filters.category) qb.andWhere('r.category = :cat', { cat: filters.category });

    const total = await qb.getCount();
    const rows = await qb
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getMany();

    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        reporterId: r.reporterId,
        reporterEmail: r.reporter?.email ?? null,
        targetUserId: r.targetUserId,
        targetUserEmail: r.targetUser?.email ?? null,
        targetMessageId: r.targetMessageId,
        category: r.category,
        description: r.description,
        status: r.status,
        adminNotes: r.adminNotes,
        resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  },

  async detail(id: string): Promise<AdminReportDetail> {
    const repo = AppDataSource.getRepository(Report);
    const r = await repo.findOne({
      where: { id },
      relations: ['reporter', 'targetUser', 'targetMessage'],
    });
    if (!r) throw new AppError('NOT_FOUND', 'Signalement introuvable', 404);

    return {
      id: r.id,
      reporterId: r.reporterId,
      reporterEmail: r.reporter?.email ?? null,
      targetUserId: r.targetUserId,
      targetUserEmail: r.targetUser?.email ?? null,
      targetMessageId: r.targetMessageId,
      targetMessageContent: r.targetMessage?.content ?? null,
      category: r.category,
      description: r.description,
      status: r.status,
      adminNotes: r.adminNotes,
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    };
  },

  async resolve(
    adminId: string,
    id: string,
    input: { status: ReportStatus; adminNotes?: string },
  ): Promise<AdminReportDetail> {
    const repo = AppDataSource.getRepository(Report);
    const r = await repo.findOne({ where: { id } });
    if (!r) throw new AppError('NOT_FOUND', 'Signalement introuvable', 404);

    if (
      input.status === ReportStatus.RESOLVED ||
      input.status === ReportStatus.DISMISSED
    ) {
      if (!input.adminNotes || input.adminNotes.trim().length === 0) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Une note admin est obligatoire pour clore un signalement',
          400,
        );
      }
    }

    r.status = input.status;
    if (input.adminNotes !== undefined) {
      r.adminNotes = input.adminNotes;
    }
    if (input.status === ReportStatus.RESOLVED || input.status === ReportStatus.DISMISSED) {
      r.resolvedAt = new Date();
    } else {
      r.resolvedAt = null;
    }
    await repo.save(r);

    await adminAuditService.record({
      adminId,
      action: 'report.resolve',
      targetType: AdminAuditTargetType.REPORT,
      targetId: id,
      payload: { status: input.status },
    });

    return adminReportsService.detail(id);
  },

  // Helpers pour vérifier l'existence d'utilisateurs / messages depuis le contrôleur.
  async assertUserExists(id: string): Promise<void> {
    const u = await AppDataSource.getRepository(User).findOne({ where: { id } });
    if (!u) throw new AppError('NOT_FOUND', 'Utilisateur introuvable', 404);
  },
  async assertMessageExists(id: string): Promise<void> {
    const m = await AppDataSource.getRepository(Message).findOne({ where: { id } });
    if (!m) throw new AppError('NOT_FOUND', 'Message introuvable', 404);
  },
};
