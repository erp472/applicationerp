export interface TotalGiroInternacionalResult {
  totalCop: string;
  pagaCop: string;
  llegaMonedaDestino: string;
  trmDia: string;
}

export function calcularTotalGiroInternacional(
  valorEnviarCop: string,
  comision: string,
  trmDia: string,
): TotalGiroInternacionalResult {
  const enviar = Number(valorEnviarCop);
  const totalCop = enviar + Number(comision);
  const llegaDestino = (enviar / Number(trmDia)).toFixed(2);
  return {
    totalCop: String(totalCop),
    pagaCop: String(totalCop),
    llegaMonedaDestino: llegaDestino,
    trmDia,
  };
}
