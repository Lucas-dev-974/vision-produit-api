import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { AppError } from '../../common/errors/app-error';
import type { UserRole, UserStatus } from '../../entities/user.entity';
import type { ReportCategory, ReportStatus } from '../../entities/report.entity';
import type { AdminAuditTargetType } from '../../entities/admin-audit-log.entity';
import { adminStatsService } from './admin-stats.service';
import { adminUsersService } from './admin-users.service';
import { adminReportsService } from './admin-reports.service';
import { adminAuditListService } from './admin-audit-list.service';

function requireAdminId(req: AuthRequest): string {
  if (!req.userId) {
    throw new AppError('UNAUTHORIZED', 'Authentification requise', 401);
  }
  return req.userId;
}

export const adminController = {
  // --- Stats ---
  stats: async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await adminStatsService.compute();
    res.json({ data });
  },

  // --- Users ---
  listUsers: async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, pageSize, role, status, q } = req.query as unknown as {
      page: number;
      pageSize: number;
      role?: UserRole;
      status?: UserStatus;
      q?: string;
    };
    const result = await adminUsersService.list({ page, pageSize, role, status, q });
    res.json({
      data: result.items,
      pagination: { page, pageSize, total: result.total },
    });
  },

  getUser: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = await adminUsersService.detail(id);
    res.json({ data: user });
  },

  approveUser: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const user = await adminUsersService.approve(adminId, id);
    res.json({ data: user });
  },

  rejectUser: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    const user = await adminUsersService.reject(adminId, id, reason);
    res.json({ data: user });
  },

  suspendUser: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    const user = await adminUsersService.suspend(adminId, id, reason);
    res.json({ data: user });
  },

  reactivateUser: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const user = await adminUsersService.reactivate(adminId, id);
    res.json({ data: user });
  },

  deleteUser: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    await adminUsersService.softDelete(adminId, id);
    res.status(204).send();
  },

  // --- Reports ---
  listReports: async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, pageSize, status, category } = req.query as unknown as {
      page: number;
      pageSize: number;
      status?: ReportStatus;
      category?: ReportCategory;
    };
    const result = await adminReportsService.list({ page, pageSize, status, category });
    res.json({
      data: result.items,
      pagination: { page, pageSize, total: result.total },
    });
  },

  getReport: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const report = await adminReportsService.detail(id);
    res.json({ data: report });
  },

  resolveReport: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const { status, adminNotes } = req.body as {
      status: ReportStatus;
      adminNotes?: string;
    };
    const report = await adminReportsService.resolve(adminId, id, { status, adminNotes });
    res.json({ data: report });
  },

  // --- Audit log ---
  listAudit: async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, pageSize, targetType, action } = req.query as unknown as {
      page: number;
      pageSize: number;
      targetType?: AdminAuditTargetType;
      action?: string;
    };
    const result = await adminAuditListService.list({ page, pageSize, targetType, action });
    res.json({
      data: result.items,
      pagination: { page, pageSize, total: result.total },
    });
  },
};
