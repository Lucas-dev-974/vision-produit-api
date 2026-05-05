import { z } from 'zod';

const trimmedString = (max: number) => z.string().trim().max(max);

export const createPreRegistrationBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  role: z.enum(['producer', 'buyer', 'undecided']),
  companyName: trimmedString(255).optional().or(z.literal('')),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/u, 'SIRET invalide')
    .optional()
    .or(z.literal('')),
  phone: trimmedString(20).optional().or(z.literal('')),
  city: trimmedString(100).optional().or(z.literal('')),
  postalCode: trimmedString(10).optional().or(z.literal('')),
  message: trimmedString(2000).optional().or(z.literal('')),
  consentRgpd: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement RGPD est requis' }),
  }),
  source: trimmedString(100).optional().or(z.literal('')),
});

export const confirmPreRegistrationBodySchema = z.object({
  token: z.string().min(20).max(128),
});

export const resendPreRegistrationBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export const listPreRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['pending_email', 'pending_review', 'contacted', 'approved', 'rejected'])
    .optional(),
});

export const preRegistrationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updatePreRegistrationStatusBodySchema = z.object({
  status: z.enum(['pending_review', 'contacted', 'approved', 'rejected']),
});

export const invitePreRegistrationBodySchema = z.object({
  message: z.string().trim().max(2000).optional(),
});

export const validateInvitationBodySchema = z.object({
  token: z.string().min(20).max(128),
});
