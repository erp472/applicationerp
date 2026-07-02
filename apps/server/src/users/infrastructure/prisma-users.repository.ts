import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IUsersRepository } from '../domain/users.repository.js';
import { UserEntity } from '../domain/user.entity.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { QueryUserDto } from '../dto/query-user.dto.js';

const SELECT = {
  idusuarios: true,
  nombreusuarios: true,
  emailusuarios: true,
  sucursales_idsucursales: true,
  activousuarios: true,
  ultimo_loginusuarios: true,
  created_atusuarios: true,
  updated_atusuarios: true,
  rol: {
    select: { codigoroles: true },
  },
  sucursal: {
    select: {
      idsucursales: true,
      codigosucursales: true,
      nombresucursales: true,
      ciudadsucursales: true,
    },
  },
} satisfies Prisma.UsuarioSelect;

type UsuarioRow = Prisma.UsuarioGetPayload<{ select: typeof SELECT }>;

function toEntity(row: UsuarioRow): UserEntity {
  return {
    id:          row.idusuarios,
    nombre:      row.nombreusuarios,
    email:       row.emailusuarios,
    rol:         row.rol.codigoroles,
    sucursalId:  row.sucursales_idsucursales ?? null,
    activo:      row.activousuarios,
    ultimoLogin: row.ultimo_loginusuarios,
    createdAt:   row.created_atusuarios,
    updatedAt:   row.updated_atusuarios,
    sucursal:    row.sucursal
      ? {
          id:     row.sucursal.idsucursales,
          codigo: row.sucursal.codigosucursales,
          nombre: row.sucursal.nombresucursales,
          ciudad: row.sucursal.ciudadsucursales,
        }
      : null,
  };
}

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, passwordHash: string): Promise<UserEntity> {
    const row = await this.prisma.usuario.create({
      data: {
        nombreusuarios:      dto.nombre,
        emailusuarios:       dto.email,
        password_hashusuarios: passwordHash,
        rol:                 { connect: { codigoroles: dto.rol } },
        ...(dto.sucursal_id != null && {
          sucursal: { connect: { idsucursales: dto.sucursal_id } },
        }),
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
      ...(rol        && { rol: { codigoroles: rol } }),
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
    const row = await this.prisma.usuario.findUnique({
      where: { idusuarios: id }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.usuario.findUnique({
      where: { emailusuarios: email }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByEmailExcluding(email: string, excludeId: number): Promise<UserEntity | null> {
    const row = await this.prisma.usuario.findFirst({
      where: { emailusuarios: email, NOT: { idusuarios: excludeId } },
      select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async update(
    id: number,
    data: { nombre?: string; email?: string; rol?: string; sucursalId?: number | null; activo?: boolean; passwordHash?: string },
  ): Promise<UserEntity> {
    const { sucursalId, rol, passwordHash, nombre, email, activo } = data;
    const row = await this.prisma.usuario.update({
      where: { idusuarios: id },
      data: {
        ...(nombre      && { nombreusuarios: nombre }),
        ...(email       && { emailusuarios: email }),
        ...(activo !== undefined && { activousuarios: activo }),
        ...(passwordHash && { password_hashusuarios: passwordHash }),
        ...(rol && { rol: { connect: { codigoroles: rol } } }),
        ...(sucursalId !== undefined && {
          sucursal: sucursalId != null
            ? { connect: { idsucursales: sucursalId } }
            : { disconnect: true },
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
