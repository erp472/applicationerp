export function calcularPesoVolumetrico(
  alto: number,
  ancho: number,
  largo: number,
  factorVolumetrico = 2500,
): number {
  return (alto * ancho * largo) / factorVolumetrico;
}
