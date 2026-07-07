import { z } from 'zod';
import { SistemaOperativoEnum } from './create-equipo.dto.js';

export const UpdateEquipoSchema = z.object({
  nombre:            z.string().max(100).nullable().optional(),
  sistema_operativo: SistemaOperativoEnum.nullable().optional(),
  activo:            z.boolean().optional(),
});

export type UpdateEquipoDto = z.infer<typeof UpdateEquipoSchema>;
