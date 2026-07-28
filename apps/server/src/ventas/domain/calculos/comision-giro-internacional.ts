export interface TarifaComision {
  tipo: 'fija' | 'porcentual';
  valor: string;
}

export function calcularComisionGiroInternacional(
  valorGiro: string,
  tarifaComision: TarifaComision,
  operador: string,
): string {
  const comisionValor = Number(tarifaComision.valor);
  if (tarifaComision.tipo === 'fija') return String(Math.round(comisionValor));
  if (tarifaComision.tipo === 'porcentual') {
    return String(Math.round((Number(valorGiro) * comisionValor) / 100));
  }
  throw new Error(`Tipo de comisión inválido para operador '${operador}': ${tarifaComision.tipo}`);
}
