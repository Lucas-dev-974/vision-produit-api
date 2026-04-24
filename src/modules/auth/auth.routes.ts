import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import {
  registerBodySchema,
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './auth.schemas';
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
} from '../../middlewares/rate-limiter';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  registerRateLimiter,
  validate({ body: registerBodySchema }),
  (req, res, next) => {
    void authController.register(req, res).catch(next);
  },
);

authRoutes.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginBodySchema }),
  (req, res, next) => {
    void authController.login(req, res).catch(next);
  },
);

authRoutes.post('/logout', authGuard, (req, res, next) => {
  void authController.logout(req, res).catch(next);
});

authRoutes.post('/refresh', (req, res, next) => {
  void authController.refresh(req, res).catch(next);
});

authRoutes.get('/me', authGuard, (req, res, next) => {
  void authController.me(req, res).catch(next);
});

authRoutes.post(
  '/verify-email',
  validate({ body: verifyEmailBodySchema }),
  (req, res, next) => {
    void authController.verifyEmail(req, res).catch(next);
  },
);

authRoutes.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validate({ body: forgotPasswordBodySchema }),
  (req, res, next) => {
    void authController.forgotPassword(req, res).catch(next);
  },
);

authRoutes.post(
  '/reset-password',
  validate({ body: resetPasswordBodySchema }),
  (req, res, next) => {
    void authController.resetPassword(req, res).catch(next);
  },
);
