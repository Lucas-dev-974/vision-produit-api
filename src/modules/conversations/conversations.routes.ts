import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authGuard } from '../../middlewares/auth-guard';
import { roleGuard } from '../../middlewares/role-guard';
import { UserRole } from '../../entities/user.entity';
import { conversationsController } from './conversations.controller';
import {
  createConversationBodySchema,
  conversationIdParamSchema,
  listMessagesQuerySchema,
  postMessageBodySchema,
} from './conversations.schemas';

export const conversationsRoutes = Router();

conversationsRoutes.get(
  '/',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  (req, res, next) => {
    void conversationsController.listMine(req, res).catch(next);
  },
);

conversationsRoutes.post(
  '/',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ body: createConversationBodySchema }),
  (req, res, next) => {
    void conversationsController.create(req, res).catch(next);
  },
);

conversationsRoutes.post(
  '/:id/read',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: conversationIdParamSchema }),
  (req, res, next) => {
    void conversationsController.markRead(req, res).catch(next);
  },
);

conversationsRoutes.get(
  '/:id/messages',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: conversationIdParamSchema, query: listMessagesQuerySchema }),
  (req, res, next) => {
    void conversationsController.listMessages(req, res).catch(next);
  },
);

conversationsRoutes.post(
  '/:id/messages',
  authGuard,
  roleGuard(UserRole.BUYER, UserRole.PRODUCER),
  validate({ params: conversationIdParamSchema, body: postMessageBodySchema }),
  (req, res, next) => {
    void conversationsController.postMessage(req, res).catch(next);
  },
);
