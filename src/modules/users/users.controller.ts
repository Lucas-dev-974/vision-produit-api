import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { usersService } from './users.service';

export const usersController = {
  patchMe: async (req: AuthRequest, res: Response): Promise<void> => {
    const body = req.body as Record<string, unknown>;
    const user = await usersService.updateMe(req.userId!, {
      phone: body.phone as string | null | undefined,
      description: body.description as string | null | undefined,
      profilePhotoUrl: body.profilePhotoUrl as string | null | undefined,
      locationLat: body.locationLat as number | undefined,
      locationLng: body.locationLng as number | undefined,
      addressLine: body.addressLine as string | null | undefined,
      city: body.city as string | null | undefined,
      postalCode: body.postalCode as string | null | undefined,
    });
    res.json({ data: user });
  },

  exportMe: async (req: AuthRequest, res: Response): Promise<void> => {
    const payload = await usersService.exportMe(req.userId!);
    res.json({ data: payload });
  },

  deleteMe: async (req: AuthRequest, res: Response): Promise<void> => {
    await usersService.softDeleteMe(req.userId!);
    res.status(204).send();
  },

  getProducerProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const card = await usersService.getProducerPublicProfile(id);
    res.json({ data: card });
  },
};
