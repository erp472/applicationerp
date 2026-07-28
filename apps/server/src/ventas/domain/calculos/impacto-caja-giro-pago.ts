export interface MovimientoGiro {
  monto: string;
  tipoMovimiento: string;
  esEntrada: boolean;
}

export function buildImpactoCajaGiroPago(monto: string): MovimientoGiro {
  return { monto, tipoMovimiento: 'giro_pago', esEntrada: false };
}
