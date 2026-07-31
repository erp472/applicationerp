import { z } from 'zod';

// RF-3.01: valorTotal debe coincidir con denominacion × cantidad (tolerancia 1 centavo)
const DenominacionSchema = z.object({
  denominacion: z.number().int().positive(),
  tipo:         z.enum(['billete', 'moneda']),
  cantidad:     z.number().int().nonnegative(),
  valorTotal:   z.number().nonnegative(),
}).refine(
  d => Math.abs(d.valorTotal - d.denominacion * d.cantidad) < 0.01,
  { message: 'valorTotal no coincide con denominacion × cantidad' },
);

export const CierreCajaSchema = z.object({
  totalArqueo:    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional(),
  denominaciones: z.array(DenominacionSchema).optional(),
  observaciones:  z.string().max(500).optional(),
}).refine(
  d => d.denominaciones && d.denominaciones.length > 0,
  { message: 'RF-3.01: el arqueo debe incluir desglose físico por denominaciones' },
);

export type CierreCajaDto = z.infer<typeof CierreCajaSchema>;
