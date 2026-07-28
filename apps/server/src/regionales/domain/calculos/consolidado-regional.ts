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

export interface SaldoSucursal {
  sucursalId: number;
  efectivo: string;
  tarjetaDebito: string;
  tarjetaCredito: string;
  transferencia: string;
  consignacion: string;
  preporteado: string;
  mixtoPreporteado: string;
}

export interface ConsolidadoResult {
  total: string;
  porMedio: Record<MedioPago, string>;
  numSucursales: number;
}

export function consolidarRegional(sucursales: SaldoSucursal[]): ConsolidadoResult {
  const totales = Object.fromEntries(MEDIOS.map((m) => [m, 0])) as Record<MedioPago, number>;
  for (const s of sucursales) {
    totales.efectivo += Number(s.efectivo ?? 0);
    totales.tarjetaDebito += Number(s.tarjetaDebito ?? 0);
    totales.tarjetaCredito += Number(s.tarjetaCredito ?? 0);
    totales.transferencia += Number(s.transferencia ?? 0);
    totales.consignacion += Number(s.consignacion ?? 0);
    totales.preporteado += Number(s.preporteado ?? 0);
    totales.mixtoPreporteado += Number(s.mixtoPreporteado ?? 0);
  }
  const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);
  return {
    total: String(totalGeneral),
    porMedio: Object.fromEntries(MEDIOS.map((m) => [m, String(totales[m])])) as Record<
      MedioPago,
      string
    >,
    numSucursales: sucursales.length,
  };
}
