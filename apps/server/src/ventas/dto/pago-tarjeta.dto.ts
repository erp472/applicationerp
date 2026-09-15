import { z } from 'zod';

export const CAMPOS_TARJETA = {
  /** Franquicia del catálogo de Tesorería — solo para tarjeta_credito */
  franquiciaId:  z.number().int().positive().optional(),
  /** Baucher del datáfono — obligatorio para débito y crédito */
  codigoVoucher: z.string().min(4).max(30).optional(),
};

export function esMedioTarjeta(medioPago?: string): boolean {
  return medioPago === 'tarjeta_debito' || medioPago === 'tarjeta_credito';
}

interface DatosTarjeta {
  medioPago?: string;
  franquiciaId?: number;
  codigoVoucher?: string;
}

export function conRefinesTarjeta<T extends z.ZodType<DatosTarjeta>>(schema: T) {
  return schema
    .refine(
      (d) => !esMedioTarjeta(d.medioPago) || !!d.codigoVoucher,
      { message: 'codigoVoucher (baucher) es requerido para pagos con tarjeta', path: ['codigoVoucher'] },
    )
    .refine(
      (d) => d.medioPago !== 'tarjeta_credito' || !!d.franquiciaId,
      { message: 'franquiciaId es requerido cuando medioPago es tarjeta_credito', path: ['franquiciaId'] },
    )
    .refine(
      (d) => d.medioPago === 'tarjeta_credito' || !d.franquiciaId,
      { message: 'franquiciaId solo aplica a tarjeta_credito', path: ['franquiciaId'] },
    );
}
