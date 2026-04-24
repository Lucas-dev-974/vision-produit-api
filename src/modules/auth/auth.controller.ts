import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { authService } from './auth.service';

function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const { email, password, siret, role } = req.body as {
      email: string;
      password: string;
      siret: string;
      role: 'producer' | 'buyer';
    };
    const { user } = await authService.register({ email, password, siret, role });
    res.status(201).json({ data: user });
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const { user, accessToken, refreshToken } = await authService.login(
      email,
      password,
      ip,
      userAgent,
    );
    const optsAccess = authService.cookieOptions(true);
    const optsRefresh = authService.cookieOptions(false);
    res.cookie('accessToken', accessToken, optsAccess);
    res.cookie('refreshToken', refreshToken, optsRefresh);
    res.json({ data: user });
  },

  logout: async (req: AuthRequest, res: Response): Promise<void> => {
    const refresh = req.cookies?.refreshToken as string | undefined;
    await authService.logout(refresh);
    clearAuthCookies(res);
    res.status(204).send();
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const refresh = req.cookies?.refreshToken as string | undefined;
    if (!refresh) {
      clearAuthCookies(res);
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Session expirée' },
      });
      return;
    }
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const { accessToken, refreshToken } = await authService.refreshSession(
      refresh,
      ip,
      userAgent,
    );
    res.cookie('accessToken', accessToken, authService.cookieOptions(true));
    res.cookie('refreshToken', refreshToken, authService.cookieOptions(false));
    res.json({ data: { ok: true } });
  },

  me: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
      });
      return;
    }
    const user = await authService.getMe(userId);
    res.json({ data: user });
  },

  verifyEmail: async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      error: { code: 'INTERNAL_ERROR', message: 'Non implémenté' },
    });
  },

  forgotPassword: async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      error: { code: 'INTERNAL_ERROR', message: 'Non implémenté' },
    });
  },

  resetPassword: async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      error: { code: 'INTERNAL_ERROR', message: 'Non implémenté' },
    });
  },
};
