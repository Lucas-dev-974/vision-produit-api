import { z } from 'zod';

const siretSchema = z.string().regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)');

export const registerBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  siret: siretSchema,
  role: z.enum(['producer', 'buyer']),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});
