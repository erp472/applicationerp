import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { RolUsuario } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IUsuariosRepository } from '../domain/usuarios.repository.js';
import { UsuarioEntity } from '../domain/usuario.entity.js';
import { CreateUsuarioDto } from '../dto/create-usuario.dto.js';
import { QueryUsuarioDto } from '../dto/query-usuario.dto.js';

const SELECT = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  sucursalId: true,
  activo: true,
  ultimoLogin: true,
  createdAt: true,
  updatedAt: true,
  sucursal: {
    select: { id: true, codigo: true, nombre: true, ciudad: true },
  },
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class PrismaUsuariosRepository implements IUsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto, passwordHash: string): Promise<UsuarioEntity> {
    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        passwordHash,
        rol: dto.rol as RolUsuario,
        sucursalId: dto.sucursal_id ?? null,
      },
      select: SELECT,
    }) as Promise<UsuarioEntity>;
  }

  async findAll(query: QueryUsuarioDto): Promise<{ datos: UsuarioEntity[]; total: number }> {
    const { rol, sucursal_id, activo, buscar, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.UsuarioWhereInput = {
      ...(rol && { rol: rol as RolUsuario }),
      ...(sucursal_id && { sucursalId: sucursal_id }),
      ...(activo !== undefined && { activo }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { email: { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, datos] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip,
        take: limite,
      }),
    ]);

    return { datos: datos as UsuarioEntity[], total };
  }

  async findById(id: string): Promise<UsuarioEntity | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: SELECT,
    }) as Promise<UsuarioEntity | null>;
  }

  async findByEmail(email: string): Promise<UsuarioEntity | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: SELECT,
    }) as Promise<UsuarioEntity | null>;
  }

  async findByEmailExcluding(email: string, excludeId: string): Promise<UsuarioEntity | null> {
    return this.prisma.usuario.findFirst({
      where: { email, NOT: { id: excludeId } },
      select: SELECT,
    }) as Promise<UsuarioEntity | null>;
  }

  async update(
    id: string,
    data: {
      nombre?: string;
      email?: string;
      rol?: string;
      sucursalId?: string | null;
      activo?: boolean;
      passwordHash?: string;
    },
  ): Promise<UsuarioEntity> {
    const { sucursalId, rol, ...rest } = data;
    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...rest,
        ...(rol && { rol: rol as RolUsuario }),
        ...(sucursalId !== undefined && {
          sucursal: sucursalId ? { connect: { id: sucursalId } } : { disconnect: true },
        }),
      },
      select: SELECT,
    }) as Promise<UsuarioEntity>;
  }

  async softDelete(id: string): Promise<{ id: string; email: string; activo: boolean }> {
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: { id: true, email: true, activo: true },
    });
  }
}
