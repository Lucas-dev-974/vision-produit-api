import { z } from 'zod';

export const createConversationBodySchema = z
  .object({
    producerId: z.string().uuid().optional(),
    buyerId: z.string().uuid().optional(),
  })
  .refine((d) => (d.producerId && !d.buyerId) || (!d.producerId && d.buyerId), {
    message: 'Fournir soit producerId (acheteur) soit buyerId (producteur)',
  });

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const postMessageBodySchema = z.object({
  content: z.string().min(1).max(2000),
});
