export function calcularTotalEnvioInternacional(
  tarifaServicio: string,
  valorSeguro = '0',
  valorEstampilla = '0',
): string {
  const total = Number(tarifaServicio) + Number(valorSeguro) + Number(valorEstampilla);
  return String(total);
}
