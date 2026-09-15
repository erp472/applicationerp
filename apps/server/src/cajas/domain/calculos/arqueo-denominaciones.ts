export interface Denominacion {
  denominacion: number;
  cantidad: number;
}

// RF-3.01: desglose tipado por billete/moneda (exigido por auditoría)
export interface DenominacionTipada extends Denominacion {
  tipo: 'billete' | 'moneda';
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

// RF-3.01: resultado con totales separados de billetes y monedas
export interface ArqueoDesglosadoResult extends ArqueoResult {
  totalBilletes: string;
  totalMonedas: string;
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

// RF-3.01: calcula con desglose obligatorio por tipo (billetes y monedas separados)
export function calcularArqueoDesglosado(denominaciones: DenominacionTipada[]): ArqueoDesglosadoResult {
  let totalBilletes = 0;
  let totalMonedas = 0;
  const desglose: DesgloseDenominacion[] = denominaciones.map(d => {
    const subtotal = d.denominacion * d.cantidad;
    if (d.tipo === 'billete') totalBilletes += subtotal;
    else totalMonedas += subtotal;
    return { denominacion: d.denominacion, cantidad: d.cantidad, subtotal: subtotal.toFixed(2) };
  });
  const total = totalBilletes + totalMonedas;
  return {
    total: total.toFixed(2),
    totalBilletes: totalBilletes.toFixed(2),
    totalMonedas: totalMonedas.toFixed(2),
    desglose,
  };
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
