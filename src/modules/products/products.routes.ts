import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { productsController } from './products.controller';
import {
  createProductBodySchema,
  updateProductBodySchema,
  productIdParamSchema,
} from './products.schemas';

export const productsRoutes = Router();

productsRoutes.get(
  '/mine',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  (req, res, next) => {
    void productsController.listMine(req, res).catch(next);
  },
);

productsRoutes.post(
  '/',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ body: createProductBodySchema }),
  (req, res, next) => {
    void productsController.create(req, res).catch(next);
  },
);

productsRoutes.get(
  '/:id',
  authGuard,
  validate({ params: productIdParamSchema }),
  (req, res, next) => {
    void productsController.getById(req, res).catch(next);
  },
);

productsRoutes.patch(
  '/:id',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: productIdParamSchema, body: updateProductBodySchema }),
  (req, res, next) => {
    void productsController.update(req, res).catch(next);
  },
);

productsRoutes.delete(
  '/:id',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: productIdParamSchema }),
  (req, res, next) => {
    void productsController.remove(req, res).catch(next);
  },
);
