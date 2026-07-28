export interface ConversionGiroResult {
  valorCop: string;
  valorMonedaDestino: string;
  trmDia: string;
}

export function calcularConversionGiroInternacional(
  valorCop: string,
  trmDia: string,
): ConversionGiroResult {
  const trm = Number(trmDia);
  if (trm <= 0) throw new Error('TRM debe ser mayor a cero');
  const destino = Number(valorCop) / trm;
  return {
    valorCop,
    valorMonedaDestino: destino.toFixed(2),
    trmDia,
  };
}
