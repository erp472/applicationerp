export interface MovimientoGiroEmision {
  monto: string;
  tipoMovimiento: string;
  esEntrada: boolean;
}

export function buildImpactoCajaGiroEmision(monto: string): MovimientoGiroEmision {
  return { monto, tipoMovimiento: 'giro_emision_cobro', esEntrada: true };
}
