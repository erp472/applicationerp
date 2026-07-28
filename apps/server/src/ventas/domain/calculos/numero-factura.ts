export function generarNumeroFactura(
  prefijo: string,
  consecutivo: number,
  digitosRelleno = 8,
): string {
  if (consecutivo <= 0) throw new Error('El consecutivo debe ser mayor a cero');
  return `${prefijo}${String(consecutivo).padStart(digitosRelleno, '0')}`;
}
