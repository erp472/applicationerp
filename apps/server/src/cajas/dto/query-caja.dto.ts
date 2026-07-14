import { z } from 'zod';

export const QueryMovimientosSchema = z.object({
  tipo:      z.string().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin:    z.string().datetime().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(200).default(50),
});

export type QueryMovimientosDto = z.infer<typeof QueryMovimientosSchema>;
