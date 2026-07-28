export function calcularPesoFacturado(
  pesoFisico: number,
  pesoVolumetrico?: number,
): number {
  if (pesoVolumetrico === undefined || pesoVolumetrico === null) {
    return pesoFisico;
  }
  return Math.max(pesoFisico, pesoVolumetrico);
}
