export interface LineaDescuento {
  descuentoMonto?: string;
}

export function calcularDescuentoTotalVenta(lineas: LineaDescuento[]): string {
  const total = lineas.reduce((acc, l) => acc + Number(l.descuentoMonto ?? '0'), 0);
  return String(total);
}
