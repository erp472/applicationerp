export interface MovimientoInventario {
  tipo: 'salida' | 'devolucion';
  cantidad: number;
  productoId: number;
  sucursalId: number;
}

export interface ImpactoInventarioResult {
  nuevoStock: number;
  movimientoInventario: MovimientoInventario;
}

// Descuenta del inventario al confirmar venta de servicio especial
export function calcularImpactoInventarioEspecial(
  stockActual: number,
  cantidad: number,
  productoId: number,
  sucursalId: number,
): ImpactoInventarioResult {
  if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
  if (stockActual < cantidad) {
    throw new Error(`Stock insuficiente: disponible ${stockActual}, requerido ${cantidad}`);
  }
  return {
    nuevoStock: stockActual - cantidad,
    movimientoInventario: { tipo: 'salida', cantidad, productoId, sucursalId },
  };
}

// Repone inventario al anular venta de servicio especial
export function calcularRestaurarInventarioEspecial(
  stockActual: number,
  cantidad: number,
  productoId: number,
  sucursalId: number,
): ImpactoInventarioResult {
  if (cantidad <= 0) throw new Error('La cantidad a reponer debe ser mayor a cero');
  return {
    nuevoStock: stockActual + cantidad,
    movimientoInventario: { tipo: 'devolucion', cantidad, productoId, sucursalId },
  };
}
