import { z } from 'zod';

export const CreateRolSchema = z.object({
  nombre:      z.string().min(2).max(80).trim(),
  descripcion: z.string().max(200).trim().optional(),
});

export const UpdateRolSchema = z.object({
  nombre:      z.string().min(2).max(80).trim().optional(),
  descripcion: z.string().max(200).trim().optional(),
  activo:      z.boolean().optional(),
});

export const CreateModuloSchema = z.object({
  nombre:      z.string().min(2).max(80).trim(),
  descripcion: z.string().max(200).trim().optional(),
  orden:       z.number().int().min(0).optional(),
});

export const UpdateModuloSchema = z.object({
  nombre:      z.string().min(2).max(80).trim().optional(),
  descripcion: z.string().max(200).trim().optional(),
  orden:       z.number().int().min(0).optional(),
  activo:      z.boolean().optional(),
});

export const CreatePermisoSchema = z.object({
  nombre:      z.string().min(2).max(80).trim(),
  descripcion: z.string().max(200).trim().optional(),
  moduloId:    z.string().uuid(),
});

export const UpdatePermisoSchema = z.object({
  nombre:      z.string().min(2).max(80).trim().optional(),
  descripcion: z.string().max(200).trim().optional(),
  activo:      z.boolean().optional(),
});

export const AssignPermisoSchema = z.object({
  permisoId: z.string().uuid(),
});

export type CreateRolDto    = z.infer<typeof CreateRolSchema>;
export type UpdateRolDto    = z.infer<typeof UpdateRolSchema>;
export type CreateModuloDto = z.infer<typeof CreateModuloSchema>;
export type UpdateModuloDto = z.infer<typeof UpdateModuloSchema>;
export type CreatePermisoDto = z.infer<typeof CreatePermisoSchema>;
export type UpdatePermisoDto = z.infer<typeof UpdatePermisoSchema>;
export type AssignPermisoDto = z.infer<typeof AssignPermisoSchema>;
