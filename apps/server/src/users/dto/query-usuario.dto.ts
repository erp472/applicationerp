import { z } from 'zod';
import { RolUsuarioEnum } from './create-usuario.dto.js';

export const QueryUsuarioSchema = z.object({
  rol: RolUsuarioEnum.optional(),
  sucursal_id: z.string().uuid().optional(),
  activo: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  buscar: z.string().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export type QueryUsuarioDto = z.infer<typeof QueryUsuarioSchema>;
