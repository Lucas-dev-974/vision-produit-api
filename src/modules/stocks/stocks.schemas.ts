import { z } from 'zod';

const unit = z.enum(['kg', 'g', 'bunch', 'crate', 'unit', 'piece', 'liter']);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format YYYY-MM-DD');

export const createStockBodySchema = z
  .object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().positive(),
    unit,
    unitPrice: z.coerce.number().min(0.01).max(9999.99),
    availableFrom: isoDate,
    expiresAt: isoDate,
  })
  .refine((d) => d.expiresAt >= d.availableFrom, {
    message: 'La date de fin doit être postérieure ou égale au début',
    path: ['expiresAt'],
  });

export const updateStockBodySchema = z
  .object({
    quantity: z.coerce.number().positive().optional(),
    unit: unit.optional(),
    unitPrice: z.coerce.number().min(0.01).max(9999.99).optional(),
    availableFrom: isoDate.optional(),
    expiresAt: isoDate.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Au moins un champ à modifier est requis',
  });

export const stockIdParamSchema = z.object({
  id: z.string().uuid(),
});
