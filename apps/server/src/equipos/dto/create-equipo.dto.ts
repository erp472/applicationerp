import { z } from 'zod';

export const SistemaOperativoEnum = z.enum(['windows', 'linux', 'macos']);

export const CreateEquipoSchema = z.object({
  sucursal_id:       z.coerce.number().int().positive(),
  mac:               z.string().min(17).max(17),
  nombre:            z.string().max(100).nullable().optional(),
  sistema_operativo: SistemaOperativoEnum.nullable().optional(),
});

export type CreateEquipoDto = z.infer<typeof CreateEquipoSchema>;
