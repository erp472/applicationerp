import { z } from 'zod';

export const EntornoSchema = z.enum(['all', 'dev', 'staging', 'prod']);

export const CreateFeatureFlagSchema = z.object({
  codigo:      z.string().min(2).max(100).trim().regex(/^[a-z0-9_:]+$/, 'Solo minúsculas, números, _ y :'),
  descripcion: z.string().max(200).trim().optional(),
  activo:      z.boolean().default(false),
  entorno:     EntornoSchema.default('all'),
});

export const UpdateFeatureFlagSchema = z.object({
  descripcion: z.string().max(200).trim().optional(),
  activo:      z.boolean().optional(),
  entorno:     EntornoSchema.optional(),
});

export const AssignRolSchema = z.object({
  rolId: z.number().int().positive(),
});

export const AssignUsuarioSchema = z.object({
  usuarioId: z.number().int().positive(),
});

export type CreateFeatureFlagDto = z.infer<typeof CreateFeatureFlagSchema>;
export type UpdateFeatureFlagDto = z.infer<typeof UpdateFeatureFlagSchema>;
export type AssignRolDto         = z.infer<typeof AssignRolSchema>;
export type AssignUsuarioDto     = z.infer<typeof AssignUsuarioSchema>;
