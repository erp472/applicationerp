export interface TarifaEco {
  tipo: 'fija' | 'porcentual';
  valor: string;
}

export function calcularEcoComercial(
  valorServicio: string,
  tarifaEco: TarifaEco,
  ecoActivo = false,
): string {
  if (!ecoActivo) return '0';
  const valor = Number(valorServicio);
  const ecoValor = Number(tarifaEco.valor);
  if (tarifaEco.tipo === 'fija') return String(Math.round(ecoValor));
  if (tarifaEco.tipo === 'porcentual') return String(Math.round((valor * ecoValor) / 100));
  throw new Error(`Tipo de eco comercial inválido: ${tarifaEco.tipo}`);
}
