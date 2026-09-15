import { z } from 'zod';
import { CAMPOS_TARJETA, conRefinesTarjeta } from './pago-tarjeta.dto.js';

export const MEDIOS_PAGO_APARTADO = [
  'efectivo',
  'tarjeta_debito',
  'tarjeta_credito',
  'transferencia',
  'consignacion',
  'cheque',
  'preporteado',
] as const;

export type MedioPagoApartado = (typeof MEDIOS_PAGO_APARTADO)[number];

export const ContratarApartadoSchema = conRefinesTarjeta(z.object({
  sucursalId:     z.number().int().positive(),
  numeroApartado: z.string().min(1).max(20),
  tamano:         z.enum(['pequeno', 'mediano', 'grande']),
  meses:          z.number().int().min(1).max(36),
  fechaInicio:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  medioPago:      z.enum(MEDIOS_PAGO_APARTADO).default('efectivo'),
  comentarios:    z.string().max(500).optional(),
  // Porción en efectivo cuando la tarjeta cubre solo parte del contrato
  montoEfectivo:  z.number().positive().optional(),
  ...CAMPOS_TARJETA,
}));

export type ContratarApartadoDto = z.infer<typeof ContratarApartadoSchema>;
