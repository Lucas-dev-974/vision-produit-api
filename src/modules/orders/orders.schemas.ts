import { z } from 'zod';

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const createOrderBodySchema = z
  .object({
    producerId: z.string().uuid(),
    retrievalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    retrievalTimeSlot: z.string().max(50).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
    items: z
      .array(
        z.object({
          stockId: z.string().uuid(),
          quantity: z.coerce.number().positive(),
        }),
      )
      .min(1),
  })
  .refine(
    (data) => new Set(data.items.map((i) => i.stockId)).size === data.items.length,
    { message: 'Chaque ligne doit référencer un stock distinct' },
  );

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const orderReasonBodySchema = z.object({
  reason: z.string().min(1).max(2000),
});
