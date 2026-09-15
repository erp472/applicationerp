import { z } from 'zod';
import { TipoSucursalEnum } from './create-sucursal.dto.js';

function parseTime(s: string): Date {
  const [h = 0, m = 0, sec = 0] = s.split(':').map(Number);
  return new Date(2000, 0, 1, h, m, sec);
}

const TimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato esperado: HH:MM o HH:MM:SS')
  .transform(parseTime)
  .nullable()
  .optional();

export const UpdateSucursalSchema = z.object({
  regional_id:      z.coerce.number().int().positive().optional(),
  nombre:           z.string().min(2).max(200).optional(),
  tipo:             TipoSucursalEnum.optional(),
  direccion:        z.string().max(500).nullable().optional(),
  telefono:         z.string().max(20).nullable().optional(),
  email:            z.string().max(200).nullable().optional(),
  horario_apertura: TimeSchema,
  horario_cierre:   TimeSchema,
  pais_id:          z.coerce.number().int().positive().nullable().optional(),
  departamento_id:  z.coerce.number().int().positive().nullable().optional(),
  ciudad_id:        z.coerce.number().int().positive().nullable().optional(),
  activo:           z.boolean().optional(),
});

export type UpdateSucursalDto = z.infer<typeof UpdateSucursalSchema>;
