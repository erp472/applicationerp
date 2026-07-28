export interface RedondeoFacturaResult {
  totalRedondeado: string;
  diferenciaMonedaCirculante: number;
}

export function calcularRedondeoFactura(totalVenta: string): RedondeoFacturaResult {
  const total = Number(totalVenta);
  const redondeado = Math.round(total);
  return {
    totalRedondeado: String(redondeado),
    diferenciaMonedaCirculante: redondeado - total,
  };
}
