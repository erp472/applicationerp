export interface TotalGiroNacionalResult {
  total: string;
  valorGiro: string;
  fleteIncluido: string;
}

export function calcularTotalGiroNacional(
  valorGiro: string,
  flete: string,
  incluyeFlete: boolean,
): TotalGiroNacionalResult {
  const giro = Number(valorGiro);
  const fleteNum = incluyeFlete ? Number(flete) : 0;
  return {
    total: String(giro + fleteNum),
    valorGiro,
    fleteIncluido: incluyeFlete ? flete : '0',
  };
}
