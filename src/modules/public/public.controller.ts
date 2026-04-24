import type { Request, Response } from 'express';
import { publicService } from './public.service';

export const publicController = {
  listProducers: async (req: Request, res: Response): Promise<void> => {
    const { page, pageSize } = req.query as unknown as {
      page: number;
      pageSize: number;
    };
    const { items, total } = await publicService.listProducers(page, pageSize);
    res.json({
      data: items,
      pagination: {
        page,
        pageSize,
        total,
      },
    });
  },

  getProducerProfile: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const data = await publicService.getProducerProfileDetail(id);
    res.json({ data });
  },
};
