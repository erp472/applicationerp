export interface MovimientoRecaudo {
  monto: string;
  tipoMovimiento: string;
  esEntrada: boolean;
}

export function buildImpactoCajaRecaudo(monto: string): MovimientoRecaudo {
  return { monto, tipoMovimiento: 'recaudo', esEntrada: true };
}
