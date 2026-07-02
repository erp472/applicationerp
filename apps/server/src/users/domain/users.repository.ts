import type { UserEntity } from './user.entity.js';
import type { CreateUserDto } from '../dto/create-user.dto.js';
import type { QueryUserDto } from '../dto/query-user.dto.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  create(dto: CreateUserDto, passwordHash: string): Promise<UserEntity>;
  findAll(query: QueryUserDto): Promise<{ datos: UserEntity[]; total: number }>;
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailExcluding(email: string, excludeId: number): Promise<UserEntity | null>;
  update(
    id: number,
    data: {
      nombre?: string;
      email?: string;
      rol?: string;
      sucursalId?: number | null;
      activo?: boolean;
      passwordHash?: string;
    },
  ): Promise<UserEntity>;
  softDelete(id: number): Promise<UserEntity>;
}
