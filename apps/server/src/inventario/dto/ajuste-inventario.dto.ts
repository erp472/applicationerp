import { z } from 'zod';

export const AjusteInventarioSchema = z.object({
  productoId:    z.number().int().positive(),
  cantidad_nueva: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  observacion:   z.string().max(500).optional(),
});

export type AjusteInventarioDto = z.infer<typeof AjusteInventarioSchema>;
