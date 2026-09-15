import type { ProductoEntity, ProductoSucursalEntity } from '../domain/producto.entity.js';

export interface ProductoResponse {
  id:               number;
  codigo:           string;
  nombre:           string;
  descripcion:      string | null;
  serie:            string | null;
  tipo:             string;
  precio:           number;
  precioSinTax:     number | null;
  porcentajeTax:    number;
  peso:             number | null;
  factorVolumetrico: number | null;
  imagenUrl:        string | null;
  activo:           boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface ProductoSucursalResponse {
  sucursalId: number;
  productoId: number;
  activo:     boolean;
  sucursal:   { id: number; codigo: string; nombre: string } | null;
}

export class ProductosPresenter {
  static toResponse(entity: ProductoEntity): ProductoResponse {
    return {
      id:               entity.id,
      codigo:           entity.codigo,
      nombre:           entity.nombre,
      descripcion:      entity.descripcion,
      serie:            entity.serie,
      tipo:             entity.tipo,
      precio:           entity.precio,
      precioSinTax:     entity.precioSinTax,
      porcentajeTax:    entity.porcentajeTax,
      peso:             entity.peso,
      factorVolumetrico: entity.factorVolumetrico,
      imagenUrl:        entity.imagenUrl,
      activo:           entity.activo,
      createdAt:        entity.createdAt.toISOString(),
      updatedAt:        entity.updatedAt.toISOString(),
    };
  }

  static toList(entities: ProductoEntity[]): ProductoResponse[] {
    return entities.map((e) => ProductosPresenter.toResponse(e));
  }

  static toSucursalResponse(entity: ProductoSucursalEntity): ProductoSucursalResponse {
    return {
      sucursalId: entity.sucursalId,
      productoId: entity.productoId,
      activo:     entity.activo,
      sucursal:   entity.sucursal ?? null,
    };
  }

  static toSucursalList(entities: ProductoSucursalEntity[]): ProductoSucursalResponse[] {
    return entities.map((e) => ProductosPresenter.toSucursalResponse(e));
  }
}
