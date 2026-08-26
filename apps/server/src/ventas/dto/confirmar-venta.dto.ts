import { z } from 'zod';

const MEDIOS_PAGO = [
  'efectivo', 'cheque', 'tarjeta_debito', 'tarjeta_credito',
  'transferencia', 'consignacion', 'preporteado', 'mixto_preporteado',
  'estampilla',
] as const;

const EstampillaItemSchema = z.object({
  codigo: z.string().min(1),
  valor:  z.number().positive(),
});

export const ConfirmarVentaSchema = z.object({
  medioPago:             z.enum(MEDIOS_PAGO),
  efectivoRecibido:      z.number().positive().optional(),
  emailFactura:          z.string().email().optional(),
  montoEstampillas:      z.number().positive().optional(),
  montoEfectivo:         z.number().positive().optional(),
  // estampilla: una entrada por cada estampilla física recibida (código + valor facial)
  estampillasUtilizadas: z.array(EstampillaItemSchema).optional(),
}).refine(
  (d) => d.medioPago !== 'efectivo' || d.efectivoRecibido !== undefined,
  { message: 'efectivoRecibido es requerido cuando medioPago es efectivo', path: ['efectivoRecibido'] },
).refine(
  (d) => d.medioPago !== 'preporteado' || d.montoEstampillas !== undefined,
  { message: 'montoEstampillas es requerido cuando medioPago es preporteado', path: ['montoEstampillas'] },
).refine(
  (d) => d.medioPago !== 'mixto_preporteado' || (d.montoEstampillas !== undefined && d.montoEfectivo !== undefined),
  { message: 'montoEstampillas y montoEfectivo son requeridos cuando medioPago es mixto_preporteado', path: ['montoEstampillas'] },
).refine(
  (d) => d.medioPago !== 'estampilla' || (d.estampillasUtilizadas !== undefined && d.estampillasUtilizadas.length > 0),
  { message: 'estampillasUtilizadas es requerido cuando medioPago es estampilla', path: ['estampillasUtilizadas'] },
);

export type ConfirmarVentaDto = z.infer<typeof ConfirmarVentaSchema>;
