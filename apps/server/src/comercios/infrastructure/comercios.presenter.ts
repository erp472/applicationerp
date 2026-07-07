import type { ComercioEntity } from '../domain/comercio.entity.js';

export interface ComercioResponse {
  id:        number;
  codigo:    string;
  nombre:    string;
  nit:       string;
  activo:    boolean;
  createdAt: string;
}

export class ComerciosPresenter {
  static toResponse(entity: ComercioEntity): ComercioResponse {
    return {
      id:        entity.id,
      codigo:    entity.codigo,
      nombre:    entity.nombre,
      nit:       entity.nit,
      activo:    entity.activo,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  static toList(entities: ComercioEntity[]): ComercioResponse[] {
    return entities.map((e) => ComerciosPresenter.toResponse(e));
  }
}
