export function calcularImpuestosAduanaDestino(
  valorDeclaradoExtranjero: string,
  porcentajeArancel: string,
): string {
  const impuesto = (Number(valorDeclaradoExtranjero) * Number(porcentajeArancel)) / 100;
  return impuesto.toFixed(2);
}
