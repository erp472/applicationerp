export interface AnulacionVentaResult {
  movimientoCaja: {
    tipoMovimiento: string;
    monto: string;
    esEntrada: boolean;
    descripcion: string;
  };
  estadoVenta: string;
  estadoFactura: string;
  revertirStock: boolean;
}

export function buildAnulacionVenta(
  totalVenta: string,
  tipoMovimientoOriginal: string,
): AnulacionVentaResult {
  return {
    movimientoCaja: {
      tipoMovimiento: 'anulacion',
      monto: totalVenta,
      esEntrada: false,
      descripcion: `Anulación de ${tipoMovimientoOriginal}`,
    },
    estadoVenta: 'anulada',
    estadoFactura: 'anulada',
    revertirStock: true,
  };
}
