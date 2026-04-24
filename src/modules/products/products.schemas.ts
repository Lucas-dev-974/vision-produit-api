import { z } from 'zod';

const category = z.enum([
  'fruits',
  'vegetables',
  'eggs',
  'honey',
  'poultry',
  'fish',
  'other',
]);

export const createProductBodySchema = z.object({
  name: z.string().min(1).max(100),
  category,
  description: z.string().max(2000),
});

export const updateProductBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    category: category.optional(),
    description: z.string().max(2000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Au moins un champ à modifier est requis',
  });

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});
