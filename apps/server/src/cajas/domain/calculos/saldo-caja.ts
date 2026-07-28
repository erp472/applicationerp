export interface Movimiento {
  monto: string;
  esEntrada: boolean;
}

// saldo = base + Σentradas − Σsalidas. Aplica tanto a sesiones principal como auxiliar.
export function calcularSaldoCaja(montoBase: string, movimientos: Movimiento[]): string {
  let saldo = Number(montoBase);
  for (const m of movimientos) {
    const monto = Number(m.monto);
    saldo += m.esEntrada ? monto : -monto;
  }
  return saldo.toFixed(2);
}
