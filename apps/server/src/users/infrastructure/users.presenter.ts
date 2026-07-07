import type { UserEntity } from '../domain/user.entity.js';

export interface UserResponse {
  id:          number;
  nombre:      string;
  email:       string;
  rol:         string;
  activo:      boolean;
  telefono:    string | null;
  ultimoLogin: string | null;
  sucursal:    { id: number; codigo: string; nombre: string; ciudad: string | null } | null;
  pais:        { id: number; nombre: string } | null;
  departamento: { id: number; nombre: string } | null;
  ciudad:      { id: number; nombre: string } | null;
  createdAt:   string;
  updatedAt:   string;
}

export class UsersPresenter {
  static toResponse(entity: UserEntity): UserResponse {
    return {
      id:           entity.id,
      nombre:       entity.nombre,
      email:        entity.email,
      rol:          entity.rol,
      activo:       entity.activo,
      telefono:     entity.telefono ?? null,
      ultimoLogin:  entity.ultimoLogin?.toISOString() ?? null,
      sucursal:     entity.sucursal ?? null,
      pais:         entity.pais         ?? null,
      departamento: entity.departamento ?? null,
      ciudad:       entity.ciudad       ?? null,
      createdAt:    entity.createdAt.toISOString(),
      updatedAt:    entity.updatedAt.toISOString(),
    };
  }

  static toList(entities: UserEntity[]): UserResponse[] {
    return entities.map((e) => UsersPresenter.toResponse(e));
  }
}
