export const MEDIOS_VALIDOS = new Set([
  'efectivo',
  'tarjeta_debito',
  'tarjeta_credito',
  'transferencia',
  'consignacion',
  'cheque',
  'preporteado',
  'mixto_preporteado',
  'estampilla',
] as const);

export type MedioPago =
  | 'efectivo'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'transferencia'
  | 'consignacion'
  | 'cheque'
  | 'preporteado'
  | 'mixto_preporteado'
  | 'estampilla';

export interface MovimientoMedioPago {
  medioPago?: string;
  monto: string;
  esEntrada: boolean;
}

// Descompone el saldo total en saldo neto por medio de pago
export function calcularSaldoPorMedioPago(
  movimientos: MovimientoMedioPago[],
): Record<MedioPago, string> {
  const saldos: Record<string, number> = {};
  for (const medio of MEDIOS_VALIDOS) saldos[medio] = 0;

  for (const mov of movimientos) {
    const medio = mov.medioPago ?? 'efectivo';
    if (!MEDIOS_VALIDOS.has(medio as MedioPago)) {
      throw new Error(`Medio de pago desconocido: ${medio}`);
    }
    const monto = Number(mov.monto);
    saldos[medio] += mov.esEntrada ? monto : -monto;
  }
  return Object.fromEntries(
    Object.entries(saldos).map(([k, v]) => [k, v.toFixed(2)]),
  ) as Record<MedioPago, string>;
}
