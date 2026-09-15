// Valida que la cantidad esté dentro de los límites del producto (cantidadMinima/cantidadMaxima)
export function validarLimitesCantidad(
  cantidad: number,
  cantidadMinima: number | null,
  cantidadMaxima: number | null,
): void {
  if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
  if (cantidadMinima !== null && cantidad < cantidadMinima) {
    throw new Error(`Cantidad ${cantidad} menor al mínimo permitido: ${cantidadMinima}`);
  }
  if (cantidadMaxima !== null && cantidad > cantidadMaxima) {
    throw new Error(`Cantidad ${cantidad} supera el máximo permitido: ${cantidadMaxima}`);
  }
}
