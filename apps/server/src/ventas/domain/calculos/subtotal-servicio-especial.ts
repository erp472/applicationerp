// subtotal = precio_unitario × cantidad − descuento_monto (absoluto COP, no porcentaje)
export function calcularSubtotalServicioEspecial(
  precioUnitario: string,
  cantidad: number,
  descuentoMonto: string = '0',
): string {
  if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
  const subtotal = Number(precioUnitario) * cantidad - Number(descuentoMonto);
  if (subtotal < 0) throw new Error('El descuento supera el valor del servicio');
  return subtotal.toFixed(2);
}
