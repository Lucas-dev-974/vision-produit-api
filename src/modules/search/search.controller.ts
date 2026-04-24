import type { Response } from 'express';
import type { z } from 'zod';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { searchService } from './search.service';
import { searchProducersQuerySchema, searchProductsQuerySchema } from './search.schemas';

type ProducersQuery = z.infer<typeof searchProducersQuerySchema>;
type ProductsQuery = z.infer<typeof searchProductsQuerySchema>;

export const searchController = {
  producers: async (req: AuthRequest, res: Response): Promise<void> => {
    const q = req.query as unknown as ProducersQuery;
    const { items, total } = await searchService.searchProducers(
      q.lat,
      q.lng,
      q.radius,
      q.category,
      q.q,
      q.sort,
      q.page,
      q.pageSize,
    );
    res.json({
      data: items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
      },
    });
  },

  products: async (req: AuthRequest, res: Response): Promise<void> => {
    const q = req.query as unknown as ProductsQuery;
    const { items, total } = await searchService.searchProducts(q.q, q.page, q.pageSize);
    res.json({
      data: items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
      },
    });
  },
};
