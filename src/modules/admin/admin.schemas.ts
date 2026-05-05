import { z } from 'zod';

const positiveInt = (def: number, max = 100) =>
  z.coerce.number().int().min(1).max(max).default(def);

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// --- Users ---
export const listUsersQuerySchema = z.object({
  page: positiveInt(1, 1_000_000),
  pageSize: positiveInt(20, 100),
  role: z.enum(['producer', 'buyer', 'admin']).optional(),
  status: z
    .enum(['pending_email', 'pending_admin', 'active', 'suspended', 'deleted'])
    .optional(),
  q: z.string().trim().min(1).max(120).optional(),
});

export const rejectUserBodySchema = z.object({
  reason: z.string().trim().min(3).max(2000),
});

export const suspendUserBodySchema = z.object({
  reason: z.string().trim().min(3).max(2000),
});

// --- Reports ---
export const listReportsQuerySchema = z.object({
  page: positiveInt(1, 1_000_000),
  pageSize: positiveInt(20, 100),
  status: z.enum(['open', 'reviewed', 'resolved', 'dismissed']).optional(),
  category: z
    .enum(['fake_profile', 'inappropriate_content', 'scam', 'harassment', 'other'])
    .optional(),
});

export const resolveReportBodySchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'dismissed']),
  adminNotes: z.string().trim().max(4000).optional(),
});

// --- Audit ---
export const listAuditQuerySchema = z.object({
  page: positiveInt(1, 1_000_000),
  pageSize: positiveInt(50, 200),
  targetType: z.enum(['user', 'pre_registration', 'report', 'system']).optional(),
  action: z.string().trim().min(1).max(64).optional(),
});

// --- Pre-registrations invite ---
export const invitePreRegistrationBodySchema = z.object({
  message: z.string().trim().max(2000).optional(),
});
