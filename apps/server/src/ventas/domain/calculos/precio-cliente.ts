export interface TarifaProducto {
  tipoClienteId: number;
  precio: string;
  vigente: boolean;
}

// Retorna precio para el tipo de cliente. Fallback: precio retail del producto.
export function calcularPrecioCliente(
  tarifas: TarifaProducto[],
  precioRetail: string,
  tipoClienteId: number | null,
): string {
  if (tipoClienteId !== null) {
    const tarifa = tarifas.find(t => t.tipoClienteId === tipoClienteId && t.vigente);
    if (tarifa) return tarifa.precio;
  }
  return precioRetail;
}
