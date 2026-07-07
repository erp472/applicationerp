import type { RegionalEntity } from '../domain/regional.entity.js';

export interface RegionalResponse {
  id:         number;
  comercioId: number;
  codigo:     string;
  nombre:     string;
  activo:     boolean;
  createdAt:  string;
  comercio:   { id: number; codigo: string; nombre: string } | null;
}

export class RegionalesPresenter {
  static toResponse(entity: RegionalEntity): RegionalResponse {
    return {
      id:         entity.id,
      comercioId: entity.comercioId,
      codigo:     entity.codigo,
      nombre:     entity.nombre,
      activo:     entity.activo,
      createdAt:  entity.createdAt.toISOString(),
      comercio:   entity.comercio ?? null,
    };
  }

  static toList(entities: RegionalEntity[]): RegionalResponse[] {
    return entities.map((e) => RegionalesPresenter.toResponse(e));
  }
}
