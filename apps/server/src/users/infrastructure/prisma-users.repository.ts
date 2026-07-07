import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IUsersRepository } from '../domain/users.repository.js';
import { UserEntity } from '../domain/user.entity.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { QueryUserDto } from '../dto/query-user.dto.js';

const SELECT = {
  idusuarios:                    true,
  nombreusuarios:                true,
  emailusuarios:                 true,
  telefonousuarios:              true,
  sucursales_idsucursales:       true,
  paises_idpaises:               true,
  departamentos_iddepartamentos: true,
  ciudades_idciudades:           true,
  activousuarios:                true,
  ultimo_loginusuarios:          true,
  created_atusuarios:            true,
  updated_atusuarios:            true,
  rol: {
    select: { codigoroles: true },
  },
  sucursal: {
    select: {
      idsucursales:     true,
      codigosucursales: true,
      nombresucursales: true,
      ciudad: { select: { nombreciudades: true } },
    },
  },
  pais:         { select: { idpaises: true, nombrepaises: true } },
  departamento: { select: { iddepartamentos: true, nombredepartamentos: true } },
  ciudad:       { select: { idciudades: true, nombreciudades: true } },
} satisfies Prisma.UsuarioSelect;

type UsuarioRow = Prisma.UsuarioGetPayload<{ select: typeof SELECT }>;

function toEntity(row: UsuarioRow): UserEntity {
  return {
    id:             row.idusuarios,
    nombre:         row.nombreusuarios,
    email:          row.emailusuarios,
    rol:            row.rol.codigoroles,
    sucursalId:     row.sucursales_idsucursales ?? null,
    telefono:       row.telefonousuarios ?? null,
    paisId:         row.paises_idpaises ?? null,
    departamentoId: row.departamentos_iddepartamentos ?? null,
    ciudadId:       row.ciudades_idciudades ?? null,
    activo:         row.activousuarios,
    ultimoLogin:    row.ultimo_loginusuarios,
    createdAt:      row.created_atusuarios,
    updatedAt:      row.updated_atusuarios,
    sucursal: row.sucursal
      ? {
          id:     row.sucursal.idsucursales,
          codigo: row.sucursal.codigosucursales,
          nombre: row.sucursal.nombresucursales,
          ciudad: row.sucursal.ciudad?.nombreciudades ?? null,
        }
      : null,
    pais:         row.pais         ? { id: row.pais.idpaises,             nombre: row.pais.nombrepaises             } : null,
    departamento: row.departamento ? { id: row.departamento.iddepartamentos, nombre: row.departamento.nombredepartamentos } : null,
    ciudad:       row.ciudad       ? { id: row.ciudad.idciudades,           nombre: row.ciudad.nombreciudades           } : null,
  };
}

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, passwordHash: string): Promise<UserEntity> {
    const row = await this.prisma.usuario.create({
      data: {
        nombreusuarios:        dto.nombre,
        emailusuarios:         dto.email,
        password_hashusuarios: passwordHash,
        telefonousuarios:      dto.telefono ?? null,
        rol:                   { connect: { codigoroles: dto.rol } },
        ...(dto.sucursal_id    != null && { sucursal:     { connect: { idsucursales:     dto.sucursal_id    } } }),
        ...(dto.pais_id        != null && { pais:         { connect: { idpaises:         dto.pais_id        } } }),
        ...(dto.departamento_id != null && { departamento: { connect: { iddepartamentos: dto.departamento_id } } }),
        ...(dto.ciudad_id      != null && { ciudad:       { connect: { idciudades:       dto.ciudad_id      } } }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QueryUserDto): Promise<{ datos: UserEntity[]; total: number }> {
    const { rol, sucursal_id, activo, buscar, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.UsuarioWhereInput = {
      deleted_atusuarios: null,
      ...(rol            && { rol: { codigoroles: rol } }),
      ...(sucursal_id != null && { sucursales_idsucursales: sucursal_id }),
      ...(activo !== undefined && { activousuarios: activo }),
      ...(buscar && {
        OR: [
          { nombreusuarios: { contains: buscar, mode: 'insensitive' } },
          { emailusuarios:  { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where, select: SELECT, orderBy: { nombreusuarios: 'asc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<UserEntity | null> {
    const row = await this.prisma.usuario.findFirst({
      where: { idusuarios: id, deleted_atusuarios: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.usuario.findFirst({
      where: { emailusuarios: email, deleted_atusuarios: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByEmailExcluding(email: string, excludeId: number): Promise<UserEntity | null> {
    const row = await this.prisma.usuario.findFirst({
      where: { emailusuarios: email, deleted_atusuarios: null, NOT: { idusuarios: excludeId } },
      select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async update(
    id: number,
    data: {
      nombre?: string; email?: string; rol?: string;
      sucursalId?: number | null; telefono?: string | null;
      paisId?: number | null; departamentoId?: number | null; ciudadId?: number | null;
      activo?: boolean; passwordHash?: string;
    },
  ): Promise<UserEntity> {
    const { sucursalId, paisId, departamentoId, ciudadId, rol, passwordHash, nombre, email, activo, telefono } = data;
    const row = await this.prisma.usuario.update({
      where: { idusuarios: id },
      data: {
        ...(nombre       && { nombreusuarios:        nombre }),
        ...(email        && { emailusuarios:          email }),
        ...(activo !== undefined && { activousuarios: activo }),
        ...(passwordHash && { password_hashusuarios: passwordHash }),
        ...(telefono !== undefined && { telefonousuarios: telefono }),
        ...(rol && { rol: { connect: { codigoroles: rol } } }),
        ...(sucursalId !== undefined && {
          sucursal: sucursalId != null ? { connect: { idsucursales: sucursalId } } : { disconnect: true },
        }),
        ...(paisId !== undefined && {
          pais: paisId != null ? { connect: { idpaises: paisId } } : { disconnect: true },
        }),
        ...(departamentoId !== undefined && {
          departamento: departamentoId != null ? { connect: { iddepartamentos: departamentoId } } : { disconnect: true },
        }),
        ...(ciudadId !== undefined && {
          ciudad: ciudadId != null ? { connect: { idciudades: ciudadId } } : { disconnect: true },
        }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<UserEntity> {
    const row = await this.prisma.usuario.update({
      where: { idusuarios: id },
      data:  { activousuarios: false, deleted_atusuarios: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }
}
