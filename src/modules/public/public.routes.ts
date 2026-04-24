import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { publicController } from './public.controller';
import {
  listPublicProducersQuerySchema,
  publicProducerIdParamSchema,
} from './public.schemas';

export const publicRoutes = Router();

publicRoutes.get(
  '/producers',
  validate({ query: listPublicProducersQuerySchema }),
  (req, res, next) => {
    void publicController.listProducers(req, res).catch(next);
  },
);

publicRoutes.get(
  '/producers/:id',
  validate({ params: publicProducerIdParamSchema }),
  (req, res, next) => {
    void publicController.getProducerProfile(req, res).catch(next);
  },
);
