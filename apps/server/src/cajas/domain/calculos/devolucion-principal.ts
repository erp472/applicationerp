import type { MovimientoCambio } from './cambio-custodia.js';

export interface DevolucionPrincipalResult {
  monto: string;
  movimientoAuxiliar: MovimientoCambio;
  movimientoPrincipal: MovimientoCambio;
}

// Al cerrar auxiliar: regresa saldo neto a la caja fuerte principal
export function calcularDevolucionAPrincipal(saldoNetoAuxiliar: string): DevolucionPrincipalResult {
  if (Number(saldoNetoAuxiliar) < 0) {
    throw new Error('Saldo neto auxiliar no puede ser negativo al cierre');
  }
  return {
    monto: saldoNetoAuxiliar,
    movimientoAuxiliar: { tipoMovimiento: 'cambio_custodia_out', esEntrada: false, monto: saldoNetoAuxiliar },
    movimientoPrincipal: { tipoMovimiento: 'cambio_custodia_in', esEntrada: true, monto: saldoNetoAuxiliar },
  };
}
