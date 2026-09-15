import type { StockEntity, MovimientoInventarioEntity } from '../domain/inventario.entity.js';

export class InventarioPresenter {
  static toStock(e: StockEntity) {
    return {
      productoId:          e.productoId,
      productoCodigo:      e.productoCodigo,
      productoNombre:      e.productoNombre,
      productoTipo:        e.productoTipo,
      sucursalId:          e.sucursalId,
      stockActual:         e.stockActual,
      stockMinimo:         e.stockMinimo,
      estado:              e.estado,
      ultimaActualizacion: e.ultimaActualizacion?.toISOString() ?? null,
    };
  }

  static toStockList(items: StockEntity[]) {
    return items.map(InventarioPresenter.toStock);
  }

  static toMovimiento(e: MovimientoInventarioEntity) {
    return {
      id:               e.id,
      tipo:             e.tipo,
      cantidad:         e.cantidad,
      cantidadAnterior: e.cantidadAnterior,
      cantidadPosterior: e.cantidadPosterior,
      referenciaId:     e.referenciaId,
      referenciaTipo:   e.referenciaTipo,
      observacion:      e.observacion,
      fecha:            e.createdAt.toISOString(),
      producto:         e.producto,
    };
  }
}
