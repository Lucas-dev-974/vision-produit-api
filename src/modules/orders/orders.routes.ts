import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { ordersController } from './orders.controller';
import {
  createOrderBodySchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  orderReasonBodySchema,
} from './orders.schemas';

export const ordersRoutes = Router();

ordersRoutes.get(
  '/mine',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ query: listOrdersQuerySchema }),
  (req, res, next) => {
    void ordersController.listMine(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/',
  authGuard,
  roleGuard(UserRole.BUYER),
  validate({ body: createOrderBodySchema }),
  (req, res, next) => {
    void ordersController.create(req, res).catch(next);
  },
);

ordersRoutes.get(
  '/:id',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: orderIdParamSchema }),
  (req, res, next) => {
    void ordersController.getById(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/seen',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: orderIdParamSchema }),
  (req, res, next) => {
    void ordersController.acknowledgeSeen(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/accept',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: orderIdParamSchema }),
  (req, res, next) => {
    void ordersController.accept(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/refuse',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: orderIdParamSchema, body: orderReasonBodySchema }),
  (req, res, next) => {
    void ordersController.refuse(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/cancel',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: orderIdParamSchema, body: orderReasonBodySchema }),
  (req, res, next) => {
    void ordersController.cancel(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/mark-honored',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: orderIdParamSchema }),
  (req, res, next) => {
    void ordersController.markHonored(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/mark-not-honored',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: orderIdParamSchema }),
  (req, res, next) => {
    void ordersController.markNotHonored(req, res).catch(next);
  },
);

ordersRoutes.post(
  '/:id/propose-alternative',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: orderIdParamSchema }),
  ordersController.notImplemented,
);

ordersRoutes.post(
  '/:id/respond-alternative',
  authGuard,
  roleGuard(UserRole.BUYER),
  validate({ params: orderIdParamSchema }),
  ordersController.notImplemented,
);
