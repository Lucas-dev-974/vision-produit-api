import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { signMessagingWsTicket } from '../../lib/jwt';

export const messagingController = {
  wsTicket: async (req: AuthRequest, res: Response): Promise<void> => {
    const ticket = signMessagingWsTicket({
      sub: req.userId!,
      role: req.userRole!,
    });
    res.json({ data: { ticket, expiresInSeconds: 120 } });
  },
};
