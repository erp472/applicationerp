import type { UserEntity } from '../domain/user.entity.js';

export interface UserResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  ultimoLogin: string | null;
  sucursal: { id: number; codigo: string; nombre: string; ciudad: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export class UsersPresenter {
  static toResponse(entity: UserEntity): UserResponse {
    return {
      id:          entity.id,
      nombre:      entity.nombre,
      email:       entity.email,
      rol:         entity.rol,
      activo:      entity.activo,
      ultimoLogin: entity.ultimoLogin?.toISOString() ?? null,
      sucursal:    entity.sucursal ?? null,
      createdAt:   entity.createdAt.toISOString(),
      updatedAt:   entity.updatedAt.toISOString(),
    };
  }

  static toList(entities: UserEntity[]): UserResponse[] {
    return entities.map((e) => UsersPresenter.toResponse(e));
  }
}
