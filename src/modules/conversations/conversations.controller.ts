import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import type { z } from 'zod';
import { conversationsService } from './conversations.service';
import {
  createConversationBodySchema,
  conversationIdParamSchema,
  listMessagesQuerySchema,
  postMessageBodySchema,
} from './conversations.schemas';

type CreateBody = z.infer<typeof createConversationBodySchema>;
type ConvParams = z.infer<typeof conversationIdParamSchema>;
type ListMsgQuery = z.infer<typeof listMessagesQuerySchema>;
type PostMsgBody = z.infer<typeof postMessageBodySchema>;

export const conversationsController = {
  listMine: async (req: AuthRequest, res: Response): Promise<void> => {
    const rows = await conversationsService.listMine(req.userId!, req.userRole!);
    res.json({ data: rows });
  },

  create: async (req: AuthRequest, res: Response): Promise<void> => {
    const body = req.body as CreateBody;
    const row = await conversationsService.getOrCreate(req.userId!, req.userRole!, {
      producerId: body.producerId,
      buyerId: body.buyerId,
    });
    res.status(201).json({ data: row });
  },

  listMessages: async (req: AuthRequest, res: Response): Promise<void> => {
    const params = req.params as unknown as ConvParams;
    const q = req.query as unknown as ListMsgQuery;
    const rows = await conversationsService.listMessages(
      params.id,
      req.userId!,
      q.before,
      q.limit,
    );
    res.json({ data: rows });
  },

  postMessage: async (req: AuthRequest, res: Response): Promise<void> => {
    const params = req.params as unknown as ConvParams;
    const body = req.body as PostMsgBody;
    const msg = await conversationsService.postMessage(params.id, req.userId!, body.content);
    res.status(201).json({ data: msg });
  },

  markRead: async (req: AuthRequest, res: Response): Promise<void> => {
    const params = req.params as unknown as ConvParams;
    await conversationsService.markMessagesRead(params.id, req.userId!);
    res.status(204).send();
  },
};
