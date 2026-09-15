export type TipoMovimientoCajaEspecial = 'venta_estampilla' | 'venta_servicio';

// Resuelve el tipo de movimiento de caja según los productos del carrito
export function resolverTipoMovimientoCajaEspecial(
  tiposProducto: string[],
): TipoMovimientoCajaEspecial {
  if (tiposProducto.length === 0) throw new Error('El carrito no tiene ítems');
  const tipos = new Set(tiposProducto);
  if (tipos.has('otro')) return 'venta_servicio';
  if (tipos.has('estampilla') || tipos.has('filatelia')) return 'venta_estampilla';
  return 'venta_servicio';
}
