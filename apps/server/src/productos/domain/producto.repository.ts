import type { ProductoEntity, ProductoSucursalEntity } from './producto.entity.js';
import type { QueryProductoDto } from '../dto/query-producto.dto.js';

export const PRODUCTOS_REPOSITORY = Symbol('PRODUCTOS_REPOSITORY');

export interface IProductosRepository {
  create(data: {
    codigo: string; nombre: string; descripcion?: string | null;
    tipo: string; precio: number; porcentajeTax: number; precioSinTax?: number | null;
    peso?: number | null; factorVolumetrico?: number | null; imagenUrl?: string | null;
  }): Promise<ProductoEntity>;

  findAll(query: QueryProductoDto): Promise<{ datos: ProductoEntity[]; total: number }>;

  findById(id: number): Promise<ProductoEntity | null>;

  codigoExists(codigo: string): Promise<boolean>;

  update(id: number, data: {
    nombre?: string; descripcion?: string | null; precio?: number;
    porcentajeTax?: number; precioSinTax?: number | null;
    peso?: number | null; factorVolumetrico?: number | null;
    imagenUrl?: string | null; activo?: boolean;
  }): Promise<ProductoEntity>;

  softDelete(id: number): Promise<ProductoEntity>;

  assignSucursal(productoId: number, sucursalId: number): Promise<ProductoSucursalEntity>;

  unassignSucursal(productoId: number, sucursalId: number): Promise<void>;

  findSucursalesByProducto(productoId: number): Promise<ProductoSucursalEntity[]>;

  sucursalExists(sucursalId: number): Promise<boolean>;

  isAssigned(productoId: number, sucursalId: number): Promise<boolean>;
}
