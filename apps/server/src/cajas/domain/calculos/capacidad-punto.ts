export interface CapacidadPuntoResult {
  capacidadTotal: number;
  auxiliaresAbiertas: number;
  puedeAbrirMas: boolean;
  cuantasPuedeAbrir: number;
}

export function calcularCapacidadPunto(
  baseGeneral: string,
  baseMinimaAuxiliar: string,
  cajasAuxiliaresAbiertas: number,
): CapacidadPuntoResult {
  const minima = Number(baseMinimaAuxiliar);
  if (minima <= 0) throw new Error('base_minima_auxiliar debe ser mayor a cero');
  const capacidadTotal = Math.floor(Number(baseGeneral) / minima);
  const puedeAbrir = Math.max(0, capacidadTotal - cajasAuxiliaresAbiertas);
  return {
    capacidadTotal,
    auxiliaresAbiertas: cajasAuxiliaresAbiertas,
    puedeAbrirMas: puedeAbrir > 0,
    cuantasPuedeAbrir: puedeAbrir,
  };
}
