import { z } from 'zod';

const MEDIOS_PAGO = [
  'efectivo', 'cheque', 'tarjeta_debito', 'tarjeta_credito',
  'transferencia', 'consignacion', 'preporteado', 'mixto_preporteado',
  'saldo_a_favor',
] as const;

export const ConfirmarVentaSchema = z.object({
  medioPago:        z.enum(MEDIOS_PAGO),
  efectivoRecibido: z.number().positive().optional(),
  emailFactura:     z.string().email().optional(),
  // preporteado / mixto_preporteado: valor cubierto por estampillas físicas
  montoEstampillas: z.number().positive().optional(),
  // mixto_preporteado: complemento en efectivo
  montoEfectivo:    z.number().positive().optional(),
}).refine(
  (d) => d.medioPago !== 'efectivo' || d.efectivoRecibido !== undefined,
  { message: 'efectivoRecibido es requerido cuando medioPago es efectivo', path: ['efectivoRecibido'] },
).refine(
  (d) => d.medioPago !== 'preporteado' || d.montoEstampillas !== undefined,
  { message: 'montoEstampillas es requerido cuando medioPago es preporteado', path: ['montoEstampillas'] },
).refine(
  (d) => d.medioPago !== 'mixto_preporteado' || (d.montoEstampillas !== undefined && d.montoEfectivo !== undefined),
  { message: 'montoEstampillas y montoEfectivo son requeridos cuando medioPago es mixto_preporteado', path: ['montoEstampillas'] },
);

export type ConfirmarVentaDto = z.infer<typeof ConfirmarVentaSchema>;
