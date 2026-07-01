import { z } from 'zod';

export const ModoEnum = z.enum(['PRODUCCION', 'AB_TEST', 'INACTIVO']);

export const CreateFeatureFlagSchema = z.object({
  nombre:      z.string().min(2).max(80).trim(),
  modo:        ModoEnum.default('PRODUCCION'),
  descripcion: z.string().max(200).trim().optional().nullable(),
});

export type CreateFeatureFlagDto = z.infer<typeof CreateFeatureFlagSchema>;

export const UpdateFeatureFlagSchema = z.object({
  modo:        ModoEnum.optional(),
  descripcion: z.string().max(200).trim().optional().nullable(),
});

export type UpdateFeatureFlagDto = z.infer<typeof UpdateFeatureFlagSchema>;
