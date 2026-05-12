import type { Request, Response } from 'express';
import {
  SurveyRespondentRole,
  SurveyResponseStatus,
} from '../../entities/survey-response.entity';
import { surveysService } from './surveys.service';

export const surveysController = {
  create: async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      contactName?: string;
      contactEmail: string;
      contactPhone: string;
      role: 'producer' | 'merchant' | 'both';
      activityType?: string;
      zone?: string[];
      sizeBracket?: string;
      answers: Record<string, unknown>;
      consentRgpd: true;
      consentRecontact?: boolean;
      source?: string;
    };

    const { id } = await surveysService.create({
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      role: body.role as SurveyRespondentRole,
      activityType: body.activityType,
      zone: body.zone,
      sizeBracket: body.sizeBracket,
      answers: body.answers,
      consentRgpd: true,
      consentRecontact: body.consentRecontact,
      source: body.source,
      ip: req.ip,
    });

    res.status(201).json({ data: { id, ok: true } });
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const { page, pageSize, status, role } = req.query as unknown as {
      page: number;
      pageSize: number;
      status?: SurveyResponseStatus;
      role?: SurveyRespondentRole;
    };
    const { items, total } = await surveysService.listForAdmin(page, pageSize, {
      status,
      role,
    });
    res.json({ data: items, pagination: { page, pageSize, total } });
  },

  get: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const data = await surveysService.getForAdmin(id);
    res.json({ data });
  },

  updateStatus: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: SurveyResponseStatus };
    const data = await surveysService.updateStatus(id, status);
    res.json({ data });
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await surveysService.delete(id);
    res.status(204).send();
  },
};
