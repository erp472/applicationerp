import { z } from 'zod';

export const CreateTipoClienteSchema = z.object({
  codigo:             z.string().min(1).max(30),
  nombre:             z.string().min(1).max(100),
  descuentoPorcentaje: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  aplicaEstampillas:  z.boolean().default(false),
  aplicaGirosSisben:  z.boolean().default(false),
  vigenciaInicio:     z.string().datetime().nullable().optional(),
  vigenciaFin:        z.string().datetime().nullable().optional(),
});

export type CreateTipoClienteDto = z.infer<typeof CreateTipoClienteSchema>;
