export interface Denominacion {
  denominacion: number;
  cantidad: number;
}

export interface DesgloseDenominacion {
  denominacion: number;
  cantidad: number;
  subtotal: string;
}

export interface ArqueoResult {
  total: string;
  desglose: DesgloseDenominacion[];
}

export interface ArqueoComparacionResult extends ArqueoResult {
  saldoEsperado: string;
  diferencia: string;
  tipoDiferencia: 'sobrante' | 'faltante' | 'cuadre';
}

// total = Σ(denominacion × cantidad)
export function calcularArqueo(denominaciones: Denominacion[]): ArqueoResult {
  let total = 0;
  const desglose: DesgloseDenominacion[] = denominaciones.map(d => {
    const subtotal = d.denominacion * d.cantidad;
    total += subtotal;
    return { denominacion: d.denominacion, cantidad: d.cantidad, subtotal: subtotal.toFixed(2) };
  });
  return { total: total.toFixed(2), desglose };
}

// Compara el total físico contra el saldo esperado del sistema
export function compararArqueoConSaldo(
  denominaciones: Denominacion[],
  saldoEsperado: string,
): ArqueoComparacionResult {
  const { total, desglose } = calcularArqueo(denominaciones);
  const diff = Number(total) - Number(saldoEsperado);
  return {
    total,
    desglose,
    saldoEsperado,
    diferencia: diff.toFixed(2),
    tipoDiferencia: diff > 0 ? 'sobrante' : diff < 0 ? 'faltante' : 'cuadre',
  };
}
