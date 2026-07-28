export function generarNumeroGuiaSecuencia(
  prefijo: string,
  consecutivo: number,
  usaSigma = false,
  guiaSigma?: string | null,
): string {
  if (usaSigma) {
    if (!guiaSigma) throw new Error('Se requiere guia_sigma cuando usa_sigma es True');
    return guiaSigma;
  }
  if (consecutivo <= 0) throw new Error('El consecutivo debe ser mayor a cero');
  return `${prefijo}${String(consecutivo).padStart(8, '0')}`;
}
