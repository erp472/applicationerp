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
import { AuditService } from '../../audit/audit.service.js';
import { auditStore } from '../../common/audit-context.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branches: IBranchesRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.repo.findByEmail(dto.email);
    if (exists) throw new EmailAlreadyRegisteredError(dto.email);

    if (dto.sucursal_id != null) {
      const branchExists = await this.branches.existsById(dto.sucursal_id);
      if (!branchExists) throw new BranchNotFoundError(String(dto.sucursal_id));
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.repo.create(dto, passwordHash);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:    'ADM-01',
      usuario_id:   userId,
      accion:       'CREATE',
      entidad:      'users',
      entidad_id:   user.id,
      ip_origen:    ip,
      resultado:    'OK',
      datos_despues: { nombre: user.nombre, email: user.email, rol: user.rol },
    });

    return user;
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
      ...(dto.nombre          && { nombre: dto.nombre }),
      ...(dto.email           && { email: dto.email }),
      ...(dto.rol             && { rol: dto.rol }),
      ...(dto.activo !== undefined  && { activo: dto.activo }),
      ...(dto.sucursal_id !== undefined    && { sucursalId:     dto.sucursal_id }),
      ...(dto.telefono !== undefined       && { telefono:       dto.telefono }),
      ...(dto.pais_id !== undefined        && { paisId:         dto.pais_id }),
      ...(dto.departamento_id !== undefined && { departamentoId: dto.departamento_id }),
      ...(dto.ciudad_id !== undefined      && { ciudadId:       dto.ciudad_id }),
      ...(dto.password && { passwordHash: await hash(dto.password, 12) }),
    };

    const updated = await this.repo.update(id, data);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:     'ADM-02',
      usuario_id:    userId,
      accion:        'UPDATE',
      entidad:       'users',
      entidad_id:    id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: { ...dto, password: dto.password ? '[REDACTED]' : undefined },
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    const deleted = await this.repo.softDelete(id);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:  'ADM-02',
      usuario_id: userId,
      accion:     'DELETE',
      entidad:    'users',
      entidad_id: id,
      ip_origen:  ip,
      resultado:  'OK',
    });

    return deleted;
  }
}
