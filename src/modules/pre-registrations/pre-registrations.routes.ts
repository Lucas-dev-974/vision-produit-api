import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import {
  preRegistrationRateLimiter,
  preRegistrationConfirmRateLimiter,
} from '../../middlewares/rate-limiter';
import { preRegistrationsController } from './pre-registrations.controller';
import {
  createPreRegistrationBodySchema,
  confirmPreRegistrationBodySchema,
  resendPreRegistrationBodySchema,
  listPreRegistrationsQuerySchema,
  preRegistrationIdParamSchema,
  updatePreRegistrationStatusBodySchema,
  invitePreRegistrationBodySchema,
  validateInvitationBodySchema,
} from './pre-registrations.schemas';

/** Endpoints publics — montés sous /v1/public/pre-registrations. */
export const publicPreRegistrationsRoutes = Router();

publicPreRegistrationsRoutes.post(
  '/',
  preRegistrationRateLimiter,
  validate({ body: createPreRegistrationBodySchema }),
  (req, res, next) => {
    void preRegistrationsController.create(req, res).catch(next);
  },
);

publicPreRegistrationsRoutes.post(
  '/confirm',
  preRegistrationConfirmRateLimiter,
  validate({ body: confirmPreRegistrationBodySchema }),
  (req, res, next) => {
    void preRegistrationsController.confirm(req, res).catch(next);
  },
);

publicPreRegistrationsRoutes.post(
  '/resend',
  preRegistrationRateLimiter,
  validate({ body: resendPreRegistrationBodySchema }),
  (req, res, next) => {
    void preRegistrationsController.resend(req, res).catch(next);
  },
);

publicPreRegistrationsRoutes.post(
  '/validate-invitation',
  preRegistrationConfirmRateLimiter,
  validate({ body: validateInvitationBodySchema }),
  (req, res, next) => {
    void preRegistrationsController.validateInvitation(req, res).catch(next);
  },
);

/** Endpoints admin — montés sous /v1/admin/pre-registrations. */
export const adminPreRegistrationsRoutes = Router();

adminPreRegistrationsRoutes.use(authGuard, roleGuard(UserRole.ADMIN));

adminPreRegistrationsRoutes.get(
  '/',
  validate({ query: listPreRegistrationsQuerySchema }),
  (req, res, next) => {
    void preRegistrationsController.list(req, res).catch(next);
  },
);

adminPreRegistrationsRoutes.patch(
  '/:id',
  validate({
    params: preRegistrationIdParamSchema,
    body: updatePreRegistrationStatusBodySchema,
  }),
  (req, res, next) => {
    void preRegistrationsController.updateStatus(req, res).catch(next);
  },
);

adminPreRegistrationsRoutes.post(
  '/:id/invite',
  validate({
    params: preRegistrationIdParamSchema,
    body: invitePreRegistrationBodySchema,
  }),
  (req, res, next) => {
    void preRegistrationsController.invite(req, res).catch(next);
  },
);
