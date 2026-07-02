import { z } from 'zod';
import { RolEnum } from './create-user.dto.js';

export const UpdateUserSchema = z.object({
  nombre:      z.string().min(2).max(200).optional(),
  email:       z.string().email().optional(),
  password:    z.string().min(8).max(100).optional(),
  rol:         RolEnum.optional(),
  sucursal_id: z.coerce.number().int().positive().nullable().optional(),
  activo:      z.boolean().optional(),
});

// Perfil propio: solo nombre, email y contraseña — sin rol ni estado
export const UpdateOwnProfileSchema = z.object({
  nombre:   z.string().min(2).max(200).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
});

export type UpdateUserDto        = z.infer<typeof UpdateUserSchema>;
export type UpdateOwnProfileDto  = z.infer<typeof UpdateOwnProfileSchema>;
