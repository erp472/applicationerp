import { z } from 'zod';

const TipoSucursalEnum = z.enum(['unipersonal', 'multipuesto']);

// "HH:MM" o "HH:MM:SS" → Date con fecha base 2000-01-01
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

export { TipoSucursalEnum };

export const CreateSucursalSchema = z.object({
  regional_id:      z.coerce.number().int().positive(),
  codigo:           z.string().min(2).max(20),
  nombre:           z.string().min(2).max(200),
  tipo:             TipoSucursalEnum.default('unipersonal'),
  direccion:        z.string().max(500).nullable().optional(),
  telefono:         z.string().max(20).nullable().optional(),
  email:            z.string().max(200).nullable().optional(),
  horario_apertura: TimeSchema,
  horario_cierre:   TimeSchema,
  pais_id:          z.coerce.number().int().positive().nullable().optional(),
  departamento_id:  z.coerce.number().int().positive().nullable().optional(),
  ciudad_id:        z.coerce.number().int().positive().nullable().optional(),
});

export type CreateSucursalDto = z.infer<typeof CreateSucursalSchema>;
