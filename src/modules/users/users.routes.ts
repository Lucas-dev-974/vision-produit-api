import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { usersController } from './users.controller';
import { patchMeBodySchema, producerIdParamSchema } from './users.schemas';

export const usersRoutes = Router();

usersRoutes.patch(
  '/me',
  authGuard,
  validate({ body: patchMeBodySchema }),
  (req, res, next) => {
    void usersController.patchMe(req, res).catch(next);
  },
);

usersRoutes.get('/me/export', authGuard, (req, res, next) => {
  void usersController.exportMe(req, res).catch(next);
});

usersRoutes.delete('/me', authGuard, (req, res, next) => {
  void usersController.deleteMe(req, res).catch(next);
});

usersRoutes.get(
  '/producers/:id',
  authGuard,
  roleGuard(UserRole.BUYER),
  validate({ params: producerIdParamSchema }),
  (req, res, next) => {
    void usersController.getProducerProfile(req, res).catch(next);
  },
);
