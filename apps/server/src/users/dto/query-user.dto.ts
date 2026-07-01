import { z } from 'zod';
import { RolEnum } from './create-user.dto.js';

export const QueryUserSchema = z.object({
  rol:         RolEnum.optional(),
  sucursal_id: z.coerce.number().int().positive().optional(),
  activo:      z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  buscar:      z.string().optional(),
  pagina:      z.coerce.number().int().min(1).default(1),
  limite:      z.coerce.number().int().min(1).max(100).default(20),
});

export type QueryUserDto = z.infer<typeof QueryUserSchema>;
