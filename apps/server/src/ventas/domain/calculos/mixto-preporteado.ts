export interface MovimientoMixto {
  tipoMovimiento: string;
  monto: string;
  esEntrada: boolean;
}

export interface MixtoPreporteadoResult {
  movimientoPreporteado: MovimientoMixto;
  movimientoEfectivo: MovimientoMixto;
}

export function buildMixtoPreporteado(
  montoEstampillas: string,
  montoEfectivo: string,
  valorServicio: string,
): MixtoPreporteadoResult {
  const estampillas = Number(montoEstampillas);
  const efectivo = Number(montoEfectivo);
  const valor = Number(valorServicio);

  if (estampillas <= 0) throw new Error('El monto de estampillas debe ser mayor a cero');
  if (efectivo <= 0) throw new Error('El monto en efectivo debe ser mayor a cero');
  if (estampillas + efectivo !== valor) {
    throw new Error(
      `Mixto no cuadra: estampillas ${montoEstampillas} + efectivo ${montoEfectivo} = ` +
        `${estampillas + efectivo}, pero el servicio cuesta ${valorServicio}`,
    );
  }

  return {
    movimientoPreporteado: { tipoMovimiento: 'preporteado', monto: montoEstampillas, esEntrada: true },
    movimientoEfectivo: { tipoMovimiento: 'efectivo', monto: montoEfectivo, esEntrada: true },
  };
}
