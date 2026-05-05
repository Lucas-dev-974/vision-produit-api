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
  registerWithInviteBodySchema,
} from './auth.schemas';
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
} from '../../middlewares/rate-limiter';
import { appAccessGate } from '../../middlewares/app-access-gate';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  appAccessGate,
  registerRateLimiter,
  validate({ body: registerBodySchema }),
  (req, res, next) => {
    void authController.register(req, res).catch(next);
  },
);

// Inscription via invitation : volontairement HORS du `appAccessGate` afin de
// permettre l'ouverture progressive (ex. invitation envoyée par un admin
// pendant la phase de pré-lancement). Le token est cryptographique et lié à
// une pré-inscription validée.
authRoutes.post(
  '/register-with-invite',
  registerRateLimiter,
  validate({ body: registerWithInviteBodySchema }),
  (req, res, next) => {
    void authController.registerWithInvite(req, res).catch(next);
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
  appAccessGate,
  forgotPasswordRateLimiter,
  validate({ body: forgotPasswordBodySchema }),
  (req, res, next) => {
    void authController.forgotPassword(req, res).catch(next);
  },
);

authRoutes.post(
  '/reset-password',
  appAccessGate,
  validate({ body: resetPasswordBodySchema }),
  (req, res, next) => {
    void authController.resetPassword(req, res).catch(next);
  },
);
