export function calcularTotalVenta(
  baseGravableTotal: string,
  descuentoTotal: string,
  ivaTotal: string,
): string {
  const total = Number(baseGravableTotal) - Number(descuentoTotal) + Number(ivaTotal);
  return String(Math.round(total));
}
