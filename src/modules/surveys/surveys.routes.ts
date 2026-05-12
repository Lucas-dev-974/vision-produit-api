import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { surveySubmitRateLimiter } from '../../middlewares/rate-limiter';
import { UserRole } from '../../entities/user.entity';
import { surveysController } from './surveys.controller';
import {
  createSurveyResponseBodySchema,
  listSurveyResponsesQuerySchema,
  surveyResponseIdParamSchema,
  updateSurveyResponseStatusBodySchema,
} from './surveys.schemas';

/** Endpoints publics — montés sous /v1/public/surveys. */
export const publicSurveysRoutes = Router();

publicSurveysRoutes.post(
  '/',
  surveySubmitRateLimiter,
  validate({ body: createSurveyResponseBodySchema }),
  (req, res, next) => {
    void surveysController.create(req, res).catch(next);
  },
);

/** Endpoints admin — montés sous /v1/admin/surveys. */
export const adminSurveysRoutes = Router();

adminSurveysRoutes.use(authGuard, roleGuard(UserRole.ADMIN));

adminSurveysRoutes.get(
  '/',
  validate({ query: listSurveyResponsesQuerySchema }),
  (req, res, next) => {
    void surveysController.list(req, res).catch(next);
  },
);

adminSurveysRoutes.get(
  '/:id',
  validate({ params: surveyResponseIdParamSchema }),
  (req, res, next) => {
    void surveysController.get(req, res).catch(next);
  },
);

adminSurveysRoutes.patch(
  '/:id',
  validate({
    params: surveyResponseIdParamSchema,
    body: updateSurveyResponseStatusBodySchema,
  }),
  (req, res, next) => {
    void surveysController.updateStatus(req, res).catch(next);
  },
);

adminSurveysRoutes.delete(
  '/:id',
  validate({ params: surveyResponseIdParamSchema }),
  (req, res, next) => {
    void surveysController.delete(req, res).catch(next);
  },
);
