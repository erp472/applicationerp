import { z } from 'zod';
import { SistemaOperativoEnum } from './create-equipo.dto.js';

export const QueryEquipoSchema = z.object({
  sucursal_id:       z.coerce.number().int().positive().optional(),
  sistema_operativo: SistemaOperativoEnum.optional(),
  activo:            z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  buscar:            z.string().optional(),
  pagina:            z.coerce.number().int().min(1).default(1),
  limite:            z.coerce.number().int().min(1).max(500).default(20),
});

export type QueryEquipoDto = z.infer<typeof QueryEquipoSchema>;
