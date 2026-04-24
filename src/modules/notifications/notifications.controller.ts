import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  summary: async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await notificationsService.summary(req.userId!, req.userRole!);
    res.json({ data });
  },
};
