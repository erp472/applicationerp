import { z } from 'zod';

const MEDIOS_PAGO = [
  'efectivo', 'cheque', 'tarjeta_debito', 'tarjeta_credito',
  'transferencia', 'consignacion', 'preporteado', 'mixto_preporteado',
] as const;

export const ConfirmarVentaSchema = z.object({
  medioPago:        z.enum(MEDIOS_PAGO),
  efectivoRecibido: z.number().positive().optional(),
  emailFactura:     z.string().email().optional(),
}).refine(
  (d) => d.medioPago !== 'efectivo' || d.efectivoRecibido !== undefined,
  { message: 'efectivoRecibido es requerido cuando medioPago es efectivo', path: ['efectivoRecibido'] },
);

export type ConfirmarVentaDto = z.infer<typeof ConfirmarVentaSchema>;
