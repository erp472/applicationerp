export type EstadoStock = 'ok' | 'bajo' | 'critico';
export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste' | 'devolucion';

export class StockEntity {
  productoId:          number;
  productoCodigo:      string;
  productoNombre:      string;
  productoTipo:        string;
  sucursalId:          number;
  stockActual:         number;
  stockMinimo:         number;
  estado:              EstadoStock;
  ultimaActualizacion: Date | null;
}

export class MovimientoInventarioEntity {
  id:               number;
  sucursalId:       number;
  productoId:       number;
  tipo:             TipoMovimientoInventario;
  cantidad:         number;
  cantidadAnterior: number;
  cantidadPosterior: number;
  referenciaId:     number | null;
  referenciaTipo:   string | null;
  observacion:      string | null;
  usuarioId:        number | null;
  createdAt:        Date;
  producto:         { id: number; codigo: string; nombre: string };
}
