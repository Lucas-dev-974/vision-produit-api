import { Router } from 'express';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { messagingController } from './messaging.controller';

export const messagingRoutes = Router();

messagingRoutes.get(
  '/ws-ticket',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  (req, res, next) => {
    void messagingController.wsTicket(req, res).catch(next);
  },
);
