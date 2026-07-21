import { z } from 'zod';

export const AgregarProductoSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad:   z.number().int().positive(),
  descuento:  z.number().nonnegative().default(0),
});

export type AgregarProductoDto = z.infer<typeof AgregarProductoSchema>;
