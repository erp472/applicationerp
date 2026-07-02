import { Injectable, Inject } from '@nestjs/common';
import { hash } from '@node-rs/bcrypt';
import { USERS_REPOSITORY } from '../domain/users.repository.js';
import type { IUsersRepository } from '../domain/users.repository.js';
import { BRANCHES_REPOSITORY } from '../domain/branches.repository.js';
import type { IBranchesRepository } from '../domain/branches.repository.js';
import {
  EmailAlreadyRegisteredError,
  BranchNotFoundError,
  UserNotFoundError,
} from '../domain/user.errors.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { QueryUserDto } from '../dto/query-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branches: IBranchesRepository,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.repo.findByEmail(dto.email);
    if (exists) throw new EmailAlreadyRegisteredError(dto.email);

    if (dto.sucursal_id != null) {
      const branchExists = await this.branches.existsById(dto.sucursal_id);
      if (!branchExists) throw new BranchNotFoundError(String(dto.sucursal_id));
    }

    const passwordHash = await hash(dto.password, 12);
    return this.repo.create(dto, passwordHash);
  }

  async findAll(query: QueryUserDto) {
    const { datos, total } = await this.repo.findAll(query);
    const { pagina, limite } = query;
    return {
      datos,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
    };
  }

  async findOne(id: number) {
    const user = await this.repo.findById(id);
    if (!user) throw new UserNotFoundError(String(id));
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const conflict = await this.repo.findByEmailExcluding(dto.email, id);
      if (conflict) throw new EmailAlreadyRegisteredError(dto.email);
    }

    if (dto.sucursal_id != null) {
      const branchExists = await this.branches.existsById(dto.sucursal_id);
      if (!branchExists) throw new BranchNotFoundError(String(dto.sucursal_id));
    }

    const data: Parameters<IUsersRepository['update']>[1] = {
      ...(dto.nombre   && { nombre: dto.nombre }),
      ...(dto.email    && { email: dto.email }),
      ...(dto.rol      && { rol: dto.rol }),
      ...(dto.activo !== undefined && { activo: dto.activo }),
      ...(dto.sucursal_id !== undefined && { sucursalId: dto.sucursal_id }),
      ...(dto.password && { passwordHash: await hash(dto.password, 12) }),
    };

    return this.repo.update(id, data);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
