import type { FeatureFlagEntity, FeatureFlagRolRef, FeatureFlagUsuarioRef } from '../domain/feature-flag.entity.js';

export interface FeatureFlagResponse {
  id: number;
  codigo: string;
  descripcion: string | null;
  activo: boolean;
  entorno: string;
  plataforma: string;
  roles: FeatureFlagRolRef[];
  usuarios: FeatureFlagUsuarioRef[];
  createdAt: string;
  updatedAt: string;
}

export class FeatureFlagsPresenter {
  static toResponse(entity: FeatureFlagEntity): FeatureFlagResponse {
    return {
      id:          entity.id,
      codigo:      entity.codigo,
      descripcion: entity.descripcion,
      activo:      entity.activo,
      entorno:     entity.entorno,
      plataforma:  entity.plataforma,
      roles:       entity.roles,
      usuarios:    entity.usuarios,
      createdAt:   entity.createdAt.toISOString(),
      updatedAt:   entity.updatedAt.toISOString(),
    };
  }

  static toList(entities: FeatureFlagEntity[]): FeatureFlagResponse[] {
    return entities.map((e) => FeatureFlagsPresenter.toResponse(e));
  }
}
