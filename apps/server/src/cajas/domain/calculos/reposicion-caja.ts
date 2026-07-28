export interface ReposicionCajaResult {
  montoRecomendado: string;
  saldoActual: string;
  baseDia: string;
  estado: 'pendiente';
  tipoMovimiento: 'reposicion';
}

// montoRecomendado = max(0, base_dia − saldo_actual + colchon)
export function calcularReposicionCaja(
  saldoActual: string,
  baseDia: string,
  colchon: string = '0',
): ReposicionCajaResult {
  const saldo = Number(saldoActual);
  const base = Number(baseDia);
  const extra = Number(colchon);
  const monto = Math.max(0, base - saldo + extra);
  return {
    montoRecomendado: monto.toFixed(2),
    saldoActual,
    baseDia,
    estado: 'pendiente',
    tipoMovimiento: 'reposicion',
  };
}
