import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { searchController } from './search.controller';
import { searchProducersQuerySchema, searchProductsQuerySchema } from './search.schemas';

export const searchRoutes = Router();

searchRoutes.get(
  '/producers',
  authGuard,
  roleGuard(UserRole.BUYER),
  validate({ query: searchProducersQuerySchema }),
  (req, res, next) => {
    void searchController.producers(req, res).catch(next);
  },
);

searchRoutes.get(
  '/products',
  authGuard,
  roleGuard(UserRole.BUYER),
  validate({ query: searchProductsQuerySchema }),
  (req, res, next) => {
    void searchController.products(req, res).catch(next);
  },
);
