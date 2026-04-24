import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AppError } from '../common/errors/app-error';
import type { UserRole } from '../entities/user.entity';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export function authGuard(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const token = bearer ?? cookieToken;
  if (!token) {
    next(new AppError('UNAUTHORIZED', 'Authentification requise', 401));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Session invalide ou expirée', 401));
  }
}
