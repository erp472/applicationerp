import { z } from 'zod';

export const QueryMovimientosSchema = z.object({
  tipo:      z.string().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin:    z.string().datetime().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(200).default(50),
});

export type QueryMovimientosDto = z.infer<typeof QueryMovimientosSchema>;

export const HistoricoQuerySchema = z.object({
  regionalId: z.coerce.number().int().positive().optional(),
  sucursalId: z.coerce.number().int().positive().optional(),
  cajaId:     z.coerce.number().int().positive().optional(),
  categoria:  z.enum(['recaudos', 'facturacion', 'anulaciones', 'ajustes']).optional(),
  desde:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pagina:     z.coerce.number().int().min(1).default(1),
  limite:     z.coerce.number().int().min(1).max(200).default(50),
});

export type HistoricoQueryDto = z.infer<typeof HistoricoQuerySchema>;
