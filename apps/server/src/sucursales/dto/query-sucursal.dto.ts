import { z } from 'zod';
import { TipoSucursalEnum } from './create-sucursal.dto.js';

export const QuerySucursalSchema = z.object({
  regional_id: z.coerce.number().int().positive().optional(),
  ciudad_id:   z.coerce.number().int().positive().optional(),
  tipo:        TipoSucursalEnum.optional(),
  activo:      z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  buscar:      z.string().optional(),
  pagina:      z.coerce.number().int().min(1).default(1),
  limite:      z.coerce.number().int().min(1).max(500).default(20),
});

export type QuerySucursalDto = z.infer<typeof QuerySucursalSchema>;
