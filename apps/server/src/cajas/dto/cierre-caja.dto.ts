import { z } from 'zod';

const DenominacionSchema = z.object({
  denominacion: z.number().int().positive(),
  tipo:         z.enum(['billete', 'moneda']),
  cantidad:     z.number().int().nonnegative(),
  valorTotal:   z.number().nonnegative(),
});

export const CierreCajaSchema = z.object({
  totalArqueo:  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  denominaciones: z.array(DenominacionSchema).optional(),
  observaciones:  z.string().max(500).optional(),
});

export type CierreCajaDto = z.infer<typeof CierreCajaSchema>;
