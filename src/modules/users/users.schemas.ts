import { z } from 'zod';

export const patchMeBodySchema = z
  .object({
    phone: z.string().max(20).nullable().optional(),
    description: z.string().max(10000).nullable().optional(),
    profilePhotoUrl: z.string().max(500).nullable().optional(),
    locationLat: z.number().min(-90).max(90).optional(),
    locationLng: z.number().min(-180).max(180).optional(),
    addressLine: z.string().max(255).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    postalCode: z.string().max(10).nullable().optional(),
  })
  .refine(
    (d) =>
      (d.locationLat === undefined && d.locationLng === undefined) ||
      (d.locationLat !== undefined && d.locationLng !== undefined),
    { message: 'Fournir latitude et longitude ensemble', path: ['locationLng'] },
  );

export const producerIdParamSchema = z.object({
  id: z.string().uuid(),
});
