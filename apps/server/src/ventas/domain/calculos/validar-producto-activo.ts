// Bloquea la venta si el producto no está habilitado para la sucursal (ProductoSucursal.activo)
export function validarProductoActivoSucursal(
  activo: boolean,
  productoId: number,
  sucursalId: number,
): void {
  if (!activo) {
    throw new Error(
      `El producto ${productoId} no está habilitado para la sucursal ${sucursalId}`,
    );
  }
}
