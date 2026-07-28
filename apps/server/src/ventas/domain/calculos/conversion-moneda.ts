export interface ConversionMonedaResult {
  valorCop: string;
  valorUsd: string;
  trmDia: string;
}

export function calcularConversionMoneda(
  valorCop: string,
  trmDia: string,
): ConversionMonedaResult {
  const trm = Number(trmDia);
  if (trm <= 0) throw new Error('TRM debe ser mayor a cero');
  const usd = Number(valorCop) / trm;
  return {
    valorCop,
    valorUsd: usd.toFixed(2),
    trmDia,
  };
}
