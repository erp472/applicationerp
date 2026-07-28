const MEDIOS = [
  'efectivo',
  'tarjetaDebito',
  'tarjetaCredito',
  'transferencia',
  'consignacion',
  'preporteado',
  'mixtoPreporteado',
] as const;

export type MedioPago = (typeof MEDIOS)[number];

export interface RegionalConsolidado {
  porMedio: Record<MedioPago, string>;
}

export interface ConsolidadoComercioResult {
  total: string;
  porMedio: Record<MedioPago, string>;
  numRegionales: number;
}

export function consolidarComercio(regionales: RegionalConsolidado[]): ConsolidadoComercioResult {
  const totales = Object.fromEntries(MEDIOS.map((m) => [m, 0])) as Record<MedioPago, number>;
  for (const r of regionales) {
    for (const m of MEDIOS) {
      totales[m] += Number(r.porMedio?.[m] ?? 0);
    }
  }
  const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);
  return {
    total: String(totalGeneral),
    porMedio: Object.fromEntries(MEDIOS.map((m) => [m, String(totales[m])])) as Record<
      MedioPago,
      string
    >,
    numRegionales: regionales.length,
  };
}
