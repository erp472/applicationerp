import { z } from 'zod';

export const QueryComercioSchema = z.object({
  buscar: z.string().optional(),
  activo: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(500).default(20),
});

export type QueryComercioDto = z.infer<typeof QueryComercioSchema>;
