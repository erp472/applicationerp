const TIPOS_VALIDOS = ['general', 'pos', 'pagos', 'menor'] as const;
export type TipoCaja = (typeof TIPOS_VALIDOS)[number];

export interface CajaInfo {
  cajaId: number;
  tipo: string;
  activaEnTurno: boolean;
}

export interface GrupoCajas {
  cajas: CajaInfo[];
  activas: number;
}

export function calcularCajasHabilitadas(
  cajas: CajaInfo[],
): Record<TipoCaja, GrupoCajas> {
  const resultado = TIPOS_VALIDOS.reduce(
    (acc, t) => { acc[t] = { cajas: [], activas: 0 }; return acc },
    {} as Record<TipoCaja, GrupoCajas>,
  );
  for (const c of cajas) {
    const tipo = c.tipo as TipoCaja;
    if (!TIPOS_VALIDOS.includes(tipo)) continue;
    resultado[tipo].cajas.push(c);
    if (c.activaEnTurno) resultado[tipo].activas++;
  }
  return resultado;
}
