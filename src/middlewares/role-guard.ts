import { Response, NextFunction } from 'express';
import { AppError } from '../common/errors/app-error';
import type { UserRole } from '../entities/user.entity';
import type { AuthRequest } from './auth-guard';

export const roleGuard =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      next(new AppError('FORBIDDEN', 'Droits insuffisants', 403));
      return;
    }
    next();
  };
