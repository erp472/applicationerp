import { z } from 'zod';

export const UpdateTipoClienteSchema = z.object({
  nombre:             z.string().min(1).max(100).optional(),
  descuentoPorcentaje: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  aplicaEstampillas:  z.boolean().optional(),
  aplicaGirosSisben:  z.boolean().optional(),
  activo:             z.boolean().optional(),
  vigenciaInicio:     z.string().datetime().nullable().optional(),
  vigenciaFin:        z.string().datetime().nullable().optional(),
});

export type UpdateTipoClienteDto = z.infer<typeof UpdateTipoClienteSchema>;
