import { Router } from 'express';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { notificationsController } from './notifications.controller';

export const notificationsRoutes = Router();

notificationsRoutes.get(
  '/summary',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  (req, res, next) => {
    void notificationsController.summary(req, res).catch(next);
  },
);
