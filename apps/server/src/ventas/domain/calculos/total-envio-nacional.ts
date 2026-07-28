export function calcularTotalEnvioNacional(
  valorServicio: string,
  valorEstampillas = '0',
  valorSeguro = '0',
  valorEco = '0',
): string {
  const total =
    Number(valorServicio) +
    Number(valorEstampillas) +
    Number(valorSeguro) +
    Number(valorEco);
  return String(total);
}
