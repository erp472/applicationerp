import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateRolDto,
  UpdateRolDto,
  CreateModuloDto,
  UpdateModuloDto,
  CreatePermisoDto,
  UpdatePermisoDto,
} from './dto/permisos.dto.js';

const ROL_SELECT = {
  id: true,
  nombre: true,
  descripcion: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  permisos: {
    select: {
      id: true,
      permisoId: true,
      permiso: {
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          modulo: { select: { id: true, nombre: true, orden: true } },
        },
      },
    },
  },
} as const;

const MODULO_SELECT = {
  id: true,
  nombre: true,
  descripcion: true,
  orden: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  permisos: {
    where: { activo: true },
    select: { id: true, nombre: true, descripcion: true },
    orderBy: { nombre: 'asc' as const },
  },
} as const;

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── ROLES ────────────────────────────────────────────────────────────────────

  async findAllRoles() {
    return this.prisma.rol.findMany({
      select: ROL_SELECT,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneRol(id: string) {
    const rol = await this.prisma.rol.findUnique({ where: { id }, select: ROL_SELECT });
    if (!rol) throw new NotFoundException(`Rol ${id} no encontrado`);
    return rol;
  }

  async createRol(dto: CreateRolDto) {
    const exists = await this.prisma.rol.findUnique({ where: { nombre: dto.nombre } });
    if (exists) throw new ConflictException(`El rol "${dto.nombre}" ya existe`);
    return this.prisma.rol.create({ data: dto, select: ROL_SELECT });
  }

  async updateRol(id: string, dto: UpdateRolDto) {
    await this.findOneRol(id);
    if (dto.nombre) {
      const conflict = await this.prisma.rol.findFirst({
        where: { nombre: dto.nombre, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`El rol "${dto.nombre}" ya existe`);
    }
    return this.prisma.rol.update({ where: { id }, data: dto, select: ROL_SELECT });
  }

  async deleteRol(id: string) {
    await this.findOneRol(id);
    await this.prisma.rol.delete({ where: { id } });
    return { id, eliminado: true };
  }

  // ── MÓDULOS ─────────────────────────────────────────────────────────────────

  async findAllModulos() {
    return this.prisma.modulo.findMany({
      select: MODULO_SELECT,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOneModulo(id: string) {
    const m = await this.prisma.modulo.findUnique({ where: { id }, select: MODULO_SELECT });
    if (!m) throw new NotFoundException(`Módulo ${id} no encontrado`);
    return m;
  }

  async createModulo(dto: CreateModuloDto) {
    const exists = await this.prisma.modulo.findUnique({ where: { nombre: dto.nombre } });
    if (exists) throw new ConflictException(`El módulo "${dto.nombre}" ya existe`);
    return this.prisma.modulo.create({ data: dto, select: MODULO_SELECT });
  }

  async updateModulo(id: string, dto: UpdateModuloDto) {
    await this.findOneModulo(id);
    if (dto.nombre) {
      const conflict = await this.prisma.modulo.findFirst({
        where: { nombre: dto.nombre, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`El módulo "${dto.nombre}" ya existe`);
    }
    return this.prisma.modulo.update({ where: { id }, data: dto, select: MODULO_SELECT });
  }

  async deleteModulo(id: string) {
    await this.findOneModulo(id);
    await this.prisma.modulo.delete({ where: { id } });
    return { id, eliminado: true };
  }

  // ── PERMISOS ─────────────────────────────────────────────────────────────────

  async findAllPermisos() {
    return this.prisma.permiso.findMany({
      select: {
        id: true, nombre: true, descripcion: true, activo: true,
        moduloId: true,
        modulo: { select: { id: true, nombre: true, orden: true } },
        createdAt: true, updatedAt: true,
      },
      orderBy: [{ modulo: { orden: 'asc' } }, { nombre: 'asc' }],
    });
  }

  async createPermiso(dto: CreatePermisoDto) {
    const moduloExists = await this.prisma.modulo.findUnique({ where: { id: dto.moduloId } });
    if (!moduloExists) throw new NotFoundException(`Módulo ${dto.moduloId} no encontrado`);

    const exists = await this.prisma.permiso.findUnique({
      where: { moduloId_nombre: { moduloId: dto.moduloId, nombre: dto.nombre } },
    });
    if (exists) throw new ConflictException(`El permiso "${dto.nombre}" ya existe en este módulo`);

    return this.prisma.permiso.create({
      data: dto,
      select: {
        id: true, nombre: true, descripcion: true, activo: true, moduloId: true,
        modulo: { select: { id: true, nombre: true } },
        createdAt: true, updatedAt: true,
      },
    });
  }

  async updatePermiso(id: string, dto: UpdatePermisoDto) {
    const p = await this.prisma.permiso.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Permiso ${id} no encontrado`);
    return this.prisma.permiso.update({
      where: { id },
      data: dto,
      select: {
        id: true, nombre: true, descripcion: true, activo: true, moduloId: true,
        modulo: { select: { id: true, nombre: true } },
        createdAt: true, updatedAt: true,
      },
    });
  }

  async deletePermiso(id: string) {
    const p = await this.prisma.permiso.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Permiso ${id} no encontrado`);
    await this.prisma.permiso.delete({ where: { id } });
    return { id, eliminado: true };
  }

  // ── ASIGNACIONES ─────────────────────────────────────────────────────────────

  async getPermisosDeRol(rolId: string) {
    await this.findOneRol(rolId);
    return this.prisma.rolPermiso.findMany({
      where: { rolId },
      select: {
        id: true,
        permisoId: true,
        permiso: {
          select: {
            id: true, nombre: true, descripcion: true,
            modulo: { select: { id: true, nombre: true, orden: true } },
          },
        },
      },
    });
  }

  async asignarPermiso(rolId: string, permisoId: string) {
    await this.findOneRol(rolId);
    const p = await this.prisma.permiso.findUnique({ where: { id: permisoId } });
    if (!p) throw new NotFoundException(`Permiso ${permisoId} no encontrado`);

    const exists = await this.prisma.rolPermiso.findUnique({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
    if (exists) return exists;

    return this.prisma.rolPermiso.create({ data: { rolId, permisoId } });
  }

  async revocarPermiso(rolId: string, permisoId: string) {
    const entry = await this.prisma.rolPermiso.findUnique({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
    if (!entry) throw new NotFoundException('Asignación no encontrada');
    await this.prisma.rolPermiso.delete({ where: { rolId_permisoId: { rolId, permisoId } } });
    return { rolId, permisoId, revocado: true };
  }

  // ── MATRIX ──────────────────────────────────────────────────────────────────

  async getMatrix() {
    const [modulos, roles] = await Promise.all([
      this.prisma.modulo.findMany({
        where: { activo: true },
        select: {
          id: true, nombre: true, descripcion: true, orden: true,
          permisos: {
            where: { activo: true },
            select: { id: true, nombre: true, descripcion: true },
            orderBy: { nombre: 'asc' },
          },
        },
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      }),
      this.prisma.rol.findMany({
        where: { activo: true },
        select: {
          id: true, nombre: true, descripcion: true,
          permisos: { select: { permisoId: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return {
      modulos,
      roles: roles.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        permisoIds: r.permisos.map((p) => p.permisoId),
      })),
    };
  }
}
