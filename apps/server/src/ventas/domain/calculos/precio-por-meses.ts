// precio = tarifa_anual × (meses / 12), redondeado al peso entero (ROUND_HALF_UP)
export function calcularPrecioPorMeses(tarifaAnual: string, mesesContratados: number): string {
  if (mesesContratados <= 0 || mesesContratados > 36) {
    throw new Error('Los meses contratados deben estar entre 1 y 36');
  }
  const precio = (Number(tarifaAnual) * mesesContratados) / 12;
  return Math.round(precio + Number.EPSILON).toFixed(0);
}
