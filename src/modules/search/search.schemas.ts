import { z } from 'zod';
import { ProductCategory } from '../../entities/product.entity';

export const searchProducersQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(500).default(50),
  category: z.nativeEnum(ProductCategory).optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(['distance', 'name', 'rating']).default('distance'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchProductsQuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
