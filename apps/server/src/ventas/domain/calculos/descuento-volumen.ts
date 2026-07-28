export interface TarifaCantidad {
  minCantidad: number;
  maxCantidad: number;
  precioUnitario: string;
}

// Lookup de precio por volumen. Si ningún tramo aplica retorna precio_base (fallback retail).
export function calcularDescuentoVolumen(
  tarifas: TarifaCantidad[],
  cantidad: number,
  precioBase: string,
): string {
  const tarifa = tarifas.find(t => t.minCantidad <= cantidad && cantidad <= t.maxCantidad);
  return tarifa ? tarifa.precioUnitario : precioBase;
}
