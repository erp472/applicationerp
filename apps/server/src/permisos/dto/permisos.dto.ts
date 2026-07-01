import { z } from 'zod';

export const CreateRolSchema = z.object({
  codigoroles: z.string().min(2).max(40).trim().toUpperCase(),
  nombreroles: z.string().min(2).max(100).trim(),
});

export const UpdateRolSchema = z.object({
  nombreroles: z.string().min(2).max(100).trim().optional(),
  activoroles: z.boolean().optional(),
});

export const CreatePermisoSchema = z.object({
  codigopermisos:      z.string().min(2).max(100).trim(),
  descripcionpermisos: z.string().max(200).trim().optional(),
  modulopermisos:      z.string().min(1).max(50).trim(),
});

export const UpdatePermisoSchema = z.object({
  descripcionpermisos: z.string().max(200).trim().optional(),
  modulopermisos:      z.string().min(1).max(50).trim().optional(),
});

export const AssignPermisoSchema = z.object({
  permisos_idpermisos: z.number().int().positive(),
});

export type CreateRolDto      = z.infer<typeof CreateRolSchema>;
export type UpdateRolDto      = z.infer<typeof UpdateRolSchema>;
export type CreatePermisoDto  = z.infer<typeof CreatePermisoSchema>;
export type UpdatePermisoDto  = z.infer<typeof UpdatePermisoSchema>;
export type AssignPermisoDto  = z.infer<typeof AssignPermisoSchema>;
