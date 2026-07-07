import type { EquipoEntity } from '../domain/equipo.entity.js';

export interface EquipoResponse {
  id:               number;
  sucursalId:       number;
  mac:              string;
  nombre:           string | null;
  sistemaOperativo: string | null;
  activo:           boolean;
  createdAt:        string;
  sucursal:         { id: number; codigo: string; nombre: string } | null;
}

export class EquiposPresenter {
  static toResponse(entity: EquipoEntity): EquipoResponse {
    return {
      id:               entity.id,
      sucursalId:       entity.sucursalId,
      mac:              entity.mac,
      nombre:           entity.nombre,
      sistemaOperativo: entity.sistemaOperativo,
      activo:           entity.activo,
      createdAt:        entity.createdAt.toISOString(),
      sucursal:         entity.sucursal ?? null,
    };
  }

  static toList(entities: EquipoEntity[]): EquipoResponse[] {
    return entities.map((e) => EquiposPresenter.toResponse(e));
  }
}
