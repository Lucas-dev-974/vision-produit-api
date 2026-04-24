import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { StockUnit } from '../../entities/stock.entity';
import { stocksService } from './stocks.service';

export const stocksController = {
  listMine: async (req: AuthRequest, res: Response): Promise<void> => {
    const list = await stocksService.listMineActive(req.userId!);
    res.json({ data: list });
  },

  create: async (req: AuthRequest, res: Response): Promise<void> => {
    const body = req.body as {
      productId: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      availableFrom: string;
      expiresAt: string;
    };
    const stock = await stocksService.create(req.userId!, {
      productId: body.productId,
      quantity: body.quantity,
      unit: body.unit as StockUnit,
      unitPrice: body.unitPrice,
      availableFrom: body.availableFrom,
      expiresAt: body.expiresAt,
    });
    res.status(201).json({ data: stock });
  },

  update: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      quantity: number;
      unit: string;
      unitPrice: number;
      availableFrom: string;
      expiresAt: string;
    }>;
    const stock = await stocksService.update(id, req.userId!, {
      quantity: body.quantity,
      unit: body.unit as StockUnit | undefined,
      unitPrice: body.unitPrice,
      availableFrom: body.availableFrom,
      expiresAt: body.expiresAt,
    });
    res.json({ data: stock });
  },

  remove: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await stocksService.delete(id, req.userId!);
    res.status(204).send();
  },
};
