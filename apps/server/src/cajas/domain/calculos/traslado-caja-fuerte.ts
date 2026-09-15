export interface TrasladoCajaFuerteResult {
  monto: string;
  tipoMovimiento: 'traslado_caja_fuerte';
  esEntrada: false;
  saldoDespues: string;
}

// Salida de efectivo hacia bóveda física. Disminuye saldo operativo del cajón.
export function calcularTrasladoCajaFuerte(
  monto: string,
  saldoActual: string,
): TrasladoCajaFuerteResult {
  const m = Number(monto);
  const s = Number(saldoActual);
  if (m <= 0) throw new Error('El monto del traslado debe ser mayor a cero');
  if (m > s) throw new Error(`Monto ${monto} supera el saldo disponible ${saldoActual}`);
  return {
    monto,
    tipoMovimiento: 'traslado_caja_fuerte',
    esEntrada: false,
    saldoDespues: (s - m).toFixed(2),
  };
}
