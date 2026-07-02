import { z } from 'zod';

export const EntornoSchema    = z.enum(['all', 'dev', 'staging', 'prod']);
export const PlataformaSchema = z.enum(['all', 'web', 'tauri']);

export const CreateFeatureFlagSchema = z.object({
  codigo:      z.string().min(2).max(100).trim().regex(/^[a-z0-9_:]+$/, 'Solo minúsculas, números, _ y :'),
  descripcion: z.string().max(200).trim().optional(),
  activo:      z.boolean().default(false),
  entorno:     EntornoSchema.default('all'),
  plataforma:  PlataformaSchema.default('all'),
  roles:       z.array(z.string().min(1)).default([]),
});

export const UpdateFeatureFlagSchema = z.object({
  descripcion: z.string().max(200).trim().optional(),
  activo:      z.boolean().optional(),
  entorno:     EntornoSchema.optional(),
  plataforma:  PlataformaSchema.optional(),
  roles:       z.array(z.string().min(1)).optional(),
});

export type CreateFeatureFlagDto = z.infer<typeof CreateFeatureFlagSchema>;
export type UpdateFeatureFlagDto = z.infer<typeof UpdateFeatureFlagSchema>;
