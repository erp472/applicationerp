export interface StockDisponibleResult {
  disponible: true;
  stockPostVenta: number;
  alertaReorden: boolean;
}

export interface AlertaStockResult {
  generarAlerta: boolean;
  payloadAlerta: {
    tipo: 'stock_minimo';
    productoId: number;
    sucursalId: number;
    stockActual: number;
    stockMinimo: number;
  } | null;
}

// Verifica disponibilidad. Lanza error si no hay stock suficiente.
export function verificarStockDisponible(
  stockActual: number,
  cantidadSolicitada: number,
  stockMinimo: number,
): StockDisponibleResult {
  if (cantidadSolicitada <= 0) throw new Error('La cantidad solicitada debe ser mayor a cero');
  if (stockActual < cantidadSolicitada) {
    throw new Error(`Stock insuficiente: disponible ${stockActual}, solicitado ${cantidadSolicitada}`);
  }
  const stockPost = stockActual - cantidadSolicitada;
  return {
    disponible: true,
    stockPostVenta: stockPost,
    alertaReorden: stockPost <= stockMinimo,
  };
}

// Genera alerta de reorden si stock <= stock_minimo
export function evaluarAlertaStockMinimo(
  stockActual: number,
  stockMinimo: number,
  productoId: number,
  sucursalId: number,
): AlertaStockResult {
  const generar = stockActual <= stockMinimo;
  return {
    generarAlerta: generar,
    payloadAlerta: generar
      ? { tipo: 'stock_minimo', productoId, sucursalId, stockActual, stockMinimo }
      : null,
  };
}
