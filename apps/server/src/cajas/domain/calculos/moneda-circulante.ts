export interface MonedaCirculanteResult {
  monto: string;
  tipoMovimiento: 'moneda_circulante';
  esEntrada: boolean;
  estado: 'pendiente';
}

// Ajuste por redondeos de tarifas CIPOS acumulados. Positivo → entrada, negativo → salida.
export function calcularMonedaCirculante(acumuladoCentavos: string): MonedaCirculanteResult {
  const acumulado = Number(acumuladoCentavos);
  const esEntrada = acumulado >= 0;
  return {
    monto: Math.abs(acumulado).toFixed(2),
    tipoMovimiento: 'moneda_circulante',
    esEntrada,
    estado: 'pendiente',
  };
}
