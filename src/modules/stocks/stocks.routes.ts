import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { stocksController } from './stocks.controller';
import {
  createStockBodySchema,
  updateStockBodySchema,
  stockIdParamSchema,
} from './stocks.schemas';

export const stocksRoutes = Router();

stocksRoutes.get(
  '/mine',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  (req, res, next) => {
    void stocksController.listMine(req, res).catch(next);
  },
);

stocksRoutes.post(
  '/',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ body: createStockBodySchema }),
  (req, res, next) => {
    void stocksController.create(req, res).catch(next);
  },
);

stocksRoutes.patch(
  '/:id',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: stockIdParamSchema, body: updateStockBodySchema }),
  (req, res, next) => {
    void stocksController.update(req, res).catch(next);
  },
);

stocksRoutes.delete(
  '/:id',
  authGuard,
  roleGuard(UserRole.PRODUCER),
  validate({ params: stockIdParamSchema }),
  (req, res, next) => {
    void stocksController.remove(req, res).catch(next);
  },
);
