import type { StockEntity, MovimientoInventarioEntity } from './inventario.entity.js';

export const INVENTARIO_REPOSITORY = Symbol('INVENTARIO_REPOSITORY');

export interface QueryStockParams {
  buscar?:      string;
  estado?:      'ok' | 'bajo' | 'critico';
  soloConStock?: boolean;
  pagina:       number;
  limite:       number;
}

export interface DescontarInventarioParams {
  productoId:  number;
  sucursalId:  number;
  cantidad:    number;
  referenciaId:   number;
  referenciaTipo: string;
  usuarioId:   number;
}

export interface RestaurarInventarioParams {
  productoId:  number;
  sucursalId:  number;
  cantidad:    number;
  referenciaId:   number;
  referenciaTipo: string;
  usuarioId:   number;
}

export interface AjustarStockParams {
  sucursalId:    number;
  productoId:    number;
  cantidadNueva: number;
  observacion?:  string;
  usuarioId:     number;
}

export interface RegistrarEntradaParams {
  sucursalId:   number;
  productoId:   number;
  cantidad:     number;
  observacion?: string;
  usuarioId:    number;
}

export interface IInventarioRepository {
  getStock(sucursalId: number, productoId: number): Promise<number | null>;
  listStock(sucursalId: number, query: QueryStockParams): Promise<{ datos: StockEntity[]; total: number }>;
  ajustar(params: AjustarStockParams): Promise<StockEntity>;
  registrarEntrada(params: RegistrarEntradaParams): Promise<StockEntity>;
  descontarInventario(params: DescontarInventarioParams): Promise<void>;
  restaurarInventario(params: RestaurarInventarioParams): Promise<void>;
  listMovimientos(
    sucursalId: number,
    query: { productoId?: number; tipo?: string; pagina: number; limite: number },
  ): Promise<{ datos: MovimientoInventarioEntity[]; total: number }>;
}
