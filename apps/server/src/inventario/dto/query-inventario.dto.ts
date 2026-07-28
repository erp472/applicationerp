import { z } from 'zod';

export const QueryInventarioSchema = z.object({
  buscar:       z.string().optional(),
  soloConStock: z.coerce.boolean().optional(),
  estado:       z.enum(['ok', 'bajo', 'critico']).optional(),
  pagina:       z.coerce.number().int().positive().default(1),
  limite:       z.coerce.number().int().positive().max(100).default(50),
});

export const QueryMovimientosSchema = z.object({
  productoId: z.coerce.number().int().positive().optional(),
  tipo:       z.enum(['entrada', 'salida', 'ajuste', 'devolucion']).optional(),
  pagina:     z.coerce.number().int().positive().default(1),
  limite:     z.coerce.number().int().positive().max(100).default(30),
});

export type QueryInventarioDto  = z.infer<typeof QueryInventarioSchema>;
export type QueryMovimientosDto = z.infer<typeof QueryMovimientosSchema>;
