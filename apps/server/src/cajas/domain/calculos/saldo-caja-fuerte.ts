import { calcularSaldoCaja, type Movimiento } from './saldo-caja.js';

// cajaFuerteGeneral = saldo sesión general + Σ devoluciones de auxiliares al cierre
export function calcularSaldoCajaFuerte(
  montoApertura: string,
  movimientosSesionGeneral: Movimiento[],
  devolucionesAuxiliares: string[],
): string {
  const saldoBase = Number(calcularSaldoCaja(montoApertura, movimientosSesionGeneral));
  const totalDevoluciones = devolucionesAuxiliares.reduce((sum, d) => sum + Number(d), 0);
  return (saldoBase + totalDevoluciones).toFixed(2);
}
