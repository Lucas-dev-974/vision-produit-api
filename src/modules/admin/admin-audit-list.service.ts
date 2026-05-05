import { AppDataSource } from '../../config/data-source';
import {
  AdminAuditLog,
  AdminAuditTargetType,
} from '../../entities/admin-audit-log.entity';

export interface AdminAuditListItem {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  action: string;
  targetType: AdminAuditTargetType;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export const adminAuditListService = {
  async list(filters: {
    page: number;
    pageSize: number;
    targetType?: AdminAuditTargetType;
    action?: string;
  }): Promise<{ items: AdminAuditListItem[]; total: number }> {
    const repo = AppDataSource.getRepository(AdminAuditLog);
    const qb = repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.admin', 'admin')
      .orderBy('a.createdAt', 'DESC');

    if (filters.targetType) {
      qb.andWhere('a.targetType = :tt', { tt: filters.targetType });
    }
    if (filters.action) {
      qb.andWhere('a.action = :action', { action: filters.action });
    }

    const total = await qb.getCount();
    const rows = await qb
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getMany();

    return {
      total,
      items: rows.map((a) => ({
        id: a.id,
        adminId: a.adminId,
        adminEmail: a.admin?.email ?? null,
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId,
        payload: a.payload,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  },
};
