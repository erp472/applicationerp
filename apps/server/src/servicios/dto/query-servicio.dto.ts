import { z } from 'zod';

export const QueryServicioSchema = z.object({
  tipo:   z.enum(['nacional', 'internacional_ms', 'internacional_courier', 'apartado_postal']).optional(),
  activo: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean()).optional(),
  buscar: z.string().optional(),
  pagina: z.preprocess(Number, z.number().int().positive()).default(1),
  limite: z.preprocess(Number, z.number().int().min(1).max(500)).default(20),
});

export type QueryServicioDto = z.infer<typeof QueryServicioSchema>;
