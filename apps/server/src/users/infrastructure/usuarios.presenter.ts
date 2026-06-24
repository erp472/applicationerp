import type { UsuarioEntity } from '../domain/usuario.entity.js';

export interface UsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  ultimoLogin: string | null;
  sucursal: { id: string; codigo: string; nombre: string; ciudad: string | null } | null;
  creadoEn: string;
  actualizadoEn: string;
}

export class UsuariosPresenter {
  static toResponse(entity: UsuarioEntity): UsuarioResponse {
    return {
      id: entity.id,
      nombre: entity.nombre,
      email: entity.email,
      rol: entity.rol,
      activo: entity.activo,
      ultimoLogin: entity.ultimoLogin?.toISOString() ?? null,
      sucursal: entity.sucursal ?? null,
      creadoEn: entity.createdAt.toISOString(),
      actualizadoEn: entity.updatedAt.toISOString(),
    };
  }

  static toList(entities: UsuarioEntity[]): UsuarioResponse[] {
    return entities.map((e) => UsuariosPresenter.toResponse(e));
  }
}
