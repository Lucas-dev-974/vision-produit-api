import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { ProductCategory } from '../../entities/product.entity';
import { productsService } from './products.service';

export const productsController = {
  listMine: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const list = await productsService.listMine(userId);
    res.json({ data: list });
  },

  create: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const body = req.body as { name: string; category: string; description: string };
    const product = await productsService.create(userId, {
      name: body.name,
      category: body.category as ProductCategory,
      description: body.description,
    });
    res.status(201).json({ data: product });
  },

  getById: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const product = await productsService.getById(id);
    res.json({ data: product });
  },

  update: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { id } = req.params as { id: string };
    const body = req.body as Partial<{
      name: string;
      category: string;
      description: string;
    }>;
    const product = await productsService.update(id, userId, {
      name: body.name,
      category: body.category as ProductCategory | undefined,
      description: body.description,
    });
    res.json({ data: product });
  },

  remove: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { id } = req.params as { id: string };
    await productsService.delete(id, userId);
    res.status(204).send();
  },
};
