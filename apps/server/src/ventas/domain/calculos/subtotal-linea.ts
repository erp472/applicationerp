// subtotal = precio_unitario × cantidad − descuento_monto (absoluto en COP, no porcentaje)
export function calcularSubtotalLinea(
  precioUnitario: string,
  cantidad: number,
  descuentoMonto: string = '0',
): string {
  if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
  const descuento = Number(descuentoMonto);
  if (descuento < 0) throw new Error('El descuento no puede ser negativo');
  const subtotal = Number(precioUnitario) * cantidad - descuento;
  if (subtotal < 0) throw new Error('El descuento supera el subtotal de la línea');
  return subtotal.toFixed(2);
}
