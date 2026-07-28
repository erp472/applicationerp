export interface RedondeoResult {
  montoRedondeado: number;
  diferencia: number;
}

// Redondea al peso entero COP (ROUND_HALF_UP). La diferencia se acumula como moneda circulante.
export function redondearMoneda(monto: number): RedondeoResult {
  const redondeado = Math.round(monto + Number.EPSILON);
  return {
    montoRedondeado: redondeado,
    diferencia: redondeado - monto,
  };
}
