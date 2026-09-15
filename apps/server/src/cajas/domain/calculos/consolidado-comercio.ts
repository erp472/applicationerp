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
  regionalId: number;
  porMedio: Record<MedioPago, string>;
}

export interface SesionConsolidado {
  sesionId: number;
  cajaId: number;
  cajaNombre: string;
  sucursalNombre: string;
  cajeroNombre: string | null;
  total: string;
  porMedio: Record<MedioPago, string>;
}

export interface ConsolidadoComercioResult {
  comercioId: number;
  total: string;
  porMedio: Record<MedioPago, string>;
  numRegionales: number;
  sesiones: SesionConsolidado[];
}

export function consolidarComercio(comercioId: number, regionales: RegionalConsolidado[]): ConsolidadoComercioResult {
  const totales = Object.fromEntries(MEDIOS.map((m) => [m, 0])) as Record<MedioPago, number>;
  for (const r of regionales) {
    for (const m of MEDIOS) {
      totales[m] += Number(r.porMedio?.[m] ?? 0);
    }
  }
  const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);
  return {
    comercioId,
    total: String(totalGeneral),
    porMedio: Object.fromEntries(MEDIOS.map((m) => [m, String(totales[m])])) as Record<
      MedioPago,
      string
    >,
    numRegionales: regionales.length,
    sesiones: [],
  };
}
