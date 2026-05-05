import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth-guard';
import { AppError } from '../../common/errors/app-error';
import {
  PreRegistrationRole,
  PreRegistrationStatus,
} from '../../entities/pre-registration.entity';
import { preRegistrationsService } from './pre-registrations.service';

function requireAdminId(req: AuthRequest): string {
  if (!req.userId) {
    throw new AppError('UNAUTHORIZED', 'Authentification requise', 401);
  }
  return req.userId;
}

export const preRegistrationsController = {
  create: async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      email: string;
      role: 'producer' | 'buyer' | 'undecided';
      companyName?: string;
      siret?: string;
      phone?: string;
      city?: string;
      postalCode?: string;
      message?: string;
      source?: string;
      consentRgpd: true;
    };

    const result = await preRegistrationsService.create({
      email: body.email,
      role: body.role as PreRegistrationRole,
      companyName: body.companyName,
      siret: body.siret,
      phone: body.phone,
      city: body.city,
      postalCode: body.postalCode,
      message: body.message,
      source: body.source,
      consentRgpd: true,
      ip: req.ip,
    });

    res.status(202).json({
      data: {
        ok: true,
        emailSent: result.status !== 'already_confirmed',
      },
    });
  },

  confirm: async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body as { token: string };
    const result = await preRegistrationsService.confirm(token);
    res.json({
      data: { email: result.email, alreadyConfirmed: result.alreadyConfirmed },
    });
  },

  resend: async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string };
    await preRegistrationsService.resend(email);
    res.json({ data: { ok: true } });
  },

  validateInvitation: async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body as { token: string };
    const data = await preRegistrationsService.validateInvitation(token);
    res.json({ data });
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const { page, pageSize, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      status?: PreRegistrationStatus;
    };
    const { items, total } = await preRegistrationsService.listForAdmin(
      page,
      pageSize,
      status,
    );
    res.json({ data: items, pagination: { page, pageSize, total } });
  },

  updateStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: PreRegistrationStatus };
    const updated = await preRegistrationsService.updateStatus(adminId, id, status);
    res.json({ data: updated });
  },

  invite: async (req: AuthRequest, res: Response): Promise<void> => {
    const adminId = requireAdminId(req);
    const { id } = req.params as { id: string };
    const { message } = (req.body ?? {}) as { message?: string };
    const updated = await preRegistrationsService.invite(
      adminId,
      id,
      message?.trim() || null,
    );
    res.json({ data: updated });
  },
};
