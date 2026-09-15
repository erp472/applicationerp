/**
 * Retorna el cobro de certificación para servicios CON CERTI.
 * Es un adicional fijo definido en el catálogo del servicio.
 */
export function calcularCertificacionCorreo(tarifaCertificacion: number | null | undefined): number {
  return tarifaCertificacion ?? 0;
}
