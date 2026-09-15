export function extraerTarifaCourier(cotizacionProveedor: Record<string, string>): string {
  if (!('tarifaCop' in cotizacionProveedor)) {
    throw new Error("La cotización del proveedor debe incluir 'tarifaCop'");
  }
  return cotizacionProveedor['tarifaCop'];
}
