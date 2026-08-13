export function calcularPesoVolumetrico(
  alto: number,
  ancho: number,
  largo: number,
  factorVolumetrico = 5000,
): number {
  return (alto * ancho * largo) / factorVolumetrico;
}
