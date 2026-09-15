export interface MovimientoCambio {
  tipoMovimiento: 'cambio_custodia_out' | 'cambio_custodia_in';
  esEntrada: boolean;
  monto: string;
}

export interface CambioCustodiaResult {
  monto: string;
  movimientoPrincipal: MovimientoCambio;
  movimientoAuxiliar: MovimientoCambio;
}

// Traspaso de fondos principal → auxiliar durante la sesión
export function calcularCambioCustodiaEnSesion(
  monto: string,
  saldoPrincipal: string,
): CambioCustodiaResult {
  const m = Number(monto);
  const s = Number(saldoPrincipal);
  if (m <= 0) throw new Error('El monto del cambio de custodia debe ser mayor a cero');
  if (m > s) throw new Error(`Monto ${monto} supera saldo disponible en principal ${saldoPrincipal}`);
  return {
    monto,
    movimientoPrincipal: { tipoMovimiento: 'cambio_custodia_out', esEntrada: false, monto },
    movimientoAuxiliar: { tipoMovimiento: 'cambio_custodia_in', esEntrada: true, monto },
  };
}

// Al aperturar auxiliar: débito en sesión principal
export function buildDebitoPrincipalPorApertura(baseAsignada: string): MovimientoCambio {
  return { tipoMovimiento: 'cambio_custodia_out', esEntrada: false, monto: baseAsignada };
}

// Al aperturar auxiliar: crédito en nueva sesión auxiliar
export function buildCreditoAuxiliarPorApertura(baseAsignada: string): MovimientoCambio {
  return { tipoMovimiento: 'cambio_custodia_in', esEntrada: true, monto: baseAsignada };
}
