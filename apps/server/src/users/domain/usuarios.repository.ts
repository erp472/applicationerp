import type { UsuarioEntity } from './usuario.entity.js';
import type { CreateUsuarioDto } from '../dto/create-usuario.dto.js';
import type { QueryUsuarioDto } from '../dto/query-usuario.dto.js';

export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');

export interface IUsuariosRepository {
  create(dto: CreateUsuarioDto, passwordHash: string): Promise<UsuarioEntity>;
  findAll(query: QueryUsuarioDto): Promise<{ datos: UsuarioEntity[]; total: number }>;
  findById(id: string): Promise<UsuarioEntity | null>;
  findByEmail(email: string): Promise<UsuarioEntity | null>;
  findByEmailExcluding(email: string, excludeId: string): Promise<UsuarioEntity | null>;
  update(
    id: string,
    data: {
      nombre?: string;
      email?: string;
      rol?: string;
      sucursalId?: string | null;
      activo?: boolean;
      passwordHash?: string;
    },
  ): Promise<UsuarioEntity>;
  softDelete(id: string): Promise<{ id: string; email: string; activo: boolean }>;
}
