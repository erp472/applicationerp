import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository.js';
import type { IUsuariosRepository } from '../domain/usuarios.repository.js';
import { SUCURSALES_REPOSITORY } from '../domain/sucursales.repository.js';
import type { ISucursalesRepository } from '../domain/sucursales.repository.js';
import {
  EmailYaRegistradoError,
  SucursalNoEncontradaError,
  UsuarioNotFoundError,
} from '../domain/usuario.errors.js';
import { CreateUsuarioDto } from '../dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto.js';
import { QueryUsuarioDto } from '../dto/query-usuario.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USUARIOS_REPOSITORY)
    private readonly repo: IUsuariosRepository,
    @Inject(SUCURSALES_REPOSITORY)
    private readonly sucursales: ISucursalesRepository,
  ) {}

  async create(dto: CreateUsuarioDto) {
    const existe = await this.repo.findByEmail(dto.email);
    if (existe) throw new EmailYaRegistradoError(dto.email);

    if (dto.sucursal_id) {
      const sucursalExiste = await this.sucursales.existsById(dto.sucursal_id);
      if (!sucursalExiste) throw new SucursalNoEncontradaError(dto.sucursal_id);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.repo.create(dto, passwordHash);
  }

  async findAll(query: QueryUsuarioDto) {
    const { datos, total } = await this.repo.findAll(query);
    const { pagina, limite } = query;
    return {
      datos,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
    };
  }

  async findOne(id: string) {
    const usuario = await this.repo.findById(id);
    if (!usuario) throw new UsuarioNotFoundError(id);
    return usuario;
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    if (dto.email) {
      const conflicto = await this.repo.findByEmailExcluding(dto.email, id);
      if (conflicto) throw new EmailYaRegistradoError(dto.email);
    }

    if (dto.sucursal_id) {
      const sucursalExiste = await this.sucursales.existsById(dto.sucursal_id);
      if (!sucursalExiste) throw new SucursalNoEncontradaError(dto.sucursal_id);
    }

    const data: Parameters<IUsuariosRepository['update']>[1] = {
      ...(dto.nombre && { nombre: dto.nombre }),
      ...(dto.email && { email: dto.email }),
      ...(dto.rol && { rol: dto.rol }),
      ...(dto.activo !== undefined && { activo: dto.activo }),
      ...(dto.sucursal_id !== undefined && { sucursalId: dto.sucursal_id }),
      ...(dto.password && { passwordHash: await bcrypt.hash(dto.password, 12) }),
    };

    return this.repo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
