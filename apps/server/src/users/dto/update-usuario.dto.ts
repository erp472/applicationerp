import { z } from 'zod';
import { RolUsuarioEnum } from './create-usuario.dto.js';

export const UpdateUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  rol: RolUsuarioEnum.optional(),
  sucursal_id: z.string().uuid().nullable().optional(),
  activo: z.boolean().optional(),
});

export type UpdateUsuarioDto = z.infer<typeof UpdateUsuarioSchema>;
