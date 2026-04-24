import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { ordersService } from './orders.service';
import type { z } from 'zod';
import {
  createOrderBodySchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  orderReasonBodySchema,
} from './orders.schemas';

type ListQuery = z.infer<typeof listOrdersQuerySchema>;
type CreateBody = z.infer<typeof createOrderBodySchema>;

export const ordersController = {
  listMine: async (req: AuthRequest, res: Response): Promise<void> => {
    const q = req.query as unknown as ListQuery;
    const { rows, total } = await ordersService.listMine(
      req.userId!,
      req.userRole!,
      q.page,
      q.pageSize,
    );
    res.json({
      data: rows,
      pagination: { page: q.page, pageSize: q.pageSize, total },
    });
  },

  create: async (req: AuthRequest, res: Response): Promise<void> => {
    const body = req.body as CreateBody;
    const detail = await ordersService.create(req.userId!, {
      producerId: body.producerId,
      retrievalDate: body.retrievalDate,
      retrievalTimeSlot: body.retrievalTimeSlot,
      note: body.note,
      items: body.items,
    });
    res.status(201).json({ data: detail });
  },

  getById: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    const detail = await ordersService.getByIdForParticipant(id, req.userId!);
    res.json({ data: detail });
  },

  acknowledgeSeen: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    await ordersService.acknowledgeSeen(id, req.userId!, req.userRole!);
    res.status(204).send();
  },

  accept: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    const detail = await ordersService.accept(id, req.userId!);
    res.json({ data: detail });
  },

  refuse: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    const { reason } = req.body as z.infer<typeof orderReasonBodySchema>;
    const detail = await ordersService.refuse(id, req.userId!, reason);
    res.json({ data: detail });
  },

  cancel: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    const { reason } = req.body as z.infer<typeof orderReasonBodySchema>;
    const detail = await ordersService.cancel(id, req.userId!, reason);
    res.json({ data: detail });
  },

  markHonored: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    const detail = await ordersService.markHonored(id, req.userId!);
    res.json({ data: detail });
  },

  markNotHonored: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as z.infer<typeof orderIdParamSchema>;
    const detail = await ordersService.markNotHonored(id, req.userId!);
    res.json({ data: detail });
  },

  notImplemented: (_req: AuthRequest, res: Response): void => {
    res.status(501).json({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Flux alternatif non implémenté dans cette version',
      },
    });
  },
};
