import { Router } from 'express';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { validate } from '../../middlewares/validate';
import { UserRole } from '../../entities/user.entity';
import { adminController } from './admin.controller';
import {
  idParamSchema,
  listAuditQuerySchema,
  listReportsQuerySchema,
  listUsersQuerySchema,
  rejectUserBodySchema,
  resolveReportBodySchema,
  suspendUserBodySchema,
} from './admin.schemas';

export const adminRoutes = Router();

adminRoutes.use(authGuard, roleGuard(UserRole.ADMIN));

// Stats globales
adminRoutes.get('/stats', (req, res, next) => {
  void adminController.stats(req, res).catch(next);
});

// Users
adminRoutes.get(
  '/users',
  validate({ query: listUsersQuerySchema }),
  (req, res, next) => {
    void adminController.listUsers(req, res).catch(next);
  },
);

adminRoutes.get(
  '/users/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => {
    void adminController.getUser(req, res).catch(next);
  },
);

adminRoutes.post(
  '/users/:id/approve',
  validate({ params: idParamSchema }),
  (req, res, next) => {
    void adminController.approveUser(req, res).catch(next);
  },
);

adminRoutes.post(
  '/users/:id/reject',
  validate({ params: idParamSchema, body: rejectUserBodySchema }),
  (req, res, next) => {
    void adminController.rejectUser(req, res).catch(next);
  },
);

adminRoutes.post(
  '/users/:id/suspend',
  validate({ params: idParamSchema, body: suspendUserBodySchema }),
  (req, res, next) => {
    void adminController.suspendUser(req, res).catch(next);
  },
);

adminRoutes.post(
  '/users/:id/reactivate',
  validate({ params: idParamSchema }),
  (req, res, next) => {
    void adminController.reactivateUser(req, res).catch(next);
  },
);

adminRoutes.delete(
  '/users/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => {
    void adminController.deleteUser(req, res).catch(next);
  },
);

// Reports
adminRoutes.get(
  '/reports',
  validate({ query: listReportsQuerySchema }),
  (req, res, next) => {
    void adminController.listReports(req, res).catch(next);
  },
);

adminRoutes.get(
  '/reports/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => {
    void adminController.getReport(req, res).catch(next);
  },
);

adminRoutes.post(
  '/reports/:id/resolve',
  validate({ params: idParamSchema, body: resolveReportBodySchema }),
  (req, res, next) => {
    void adminController.resolveReport(req, res).catch(next);
  },
);

// Audit log
adminRoutes.get(
  '/audit',
  validate({ query: listAuditQuerySchema }),
  (req, res, next) => {
    void adminController.listAudit(req, res).catch(next);
  },
);
