import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  RolNotFoundError,
  PermisoNotFoundError,
  RolNombreDuplicadoError,
  PermisoNombreDuplicadoError,
  RolPermisoYaAsignadoError,
} from '../domain/permisos.errors.js';
import type { CreateRolDto, UpdateRolDto } from '../dto/create-rol.dto.js';
import type { CreatePermisoDto, UpdatePermisoDto } from '../dto/create-permiso.dto.js';

export interface CanOpciones {
  rol?: string;
  permiso?: string;
}

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── can() ───────────────────────────────────────────────────────────────────
  // Verifica si un usuario cumple el criterio indicado.
  // Lógica OR: pasa si tiene el rol O tiene el permiso específico.
  async can(usuarioId: string, usuarioRolEnum: string, opciones: CanOpciones): Promise<boolean> {
    const { rol, permiso } = opciones;

    const tieneRol   = rol     ? usuarioRolEnum === rol : null;
    const tienePermiso = permiso ? await this.usuarioTienePermiso(usuarioId, permiso) : null;

    if (rol && permiso)  return (tieneRol ?? false) || (tienePermiso ?? false);
    if (rol)             return tieneRol ?? false;
    if (permiso)         return tienePermiso ?? false;
    return true;
  }

  private async usuarioTienePermiso(usuarioId: string, nombrePermiso: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rolId: true },
    });
    if (!usuario?.rolId) return false;

    const match = await this.prisma.rolPermiso.findFirst({
      where: {
        rolId:   usuario.rolId,
        permiso: { nombre: nombrePermiso },
      },
    });
    return !!match;
  }

  // ─── ROLES ────────────────────────────────────────────────────────────────────
  async findAllRoles() {
    return this.prisma.rol.findMany({
      orderBy: { nombre: 'asc' },
      include: { permisos: { include: { permiso: { select: { id: true, nombre: true } } } } },
    });
  }

  async findOneRol(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: { permisos: { include: { permiso: { select: { id: true, nombre: true } } } } },
    });
    if (!rol) throw new RolNotFoundError(id);
    return rol;
  }

  async createRol(dto: CreateRolDto) {
    const existe = await this.prisma.rol.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new RolNombreDuplicadoError(dto.nombre);
    return this.prisma.rol.create({ data: { nombre: dto.nombre } });
  }

  async updateRol(id: string, dto: UpdateRolDto) {
    await this.findOneRol(id);
    if (dto.nombre) {
      const conflicto = await this.prisma.rol.findFirst({ where: { nombre: dto.nombre, NOT: { id } } });
      if (conflicto) throw new RolNombreDuplicadoError(dto.nombre);
    }
    return this.prisma.rol.update({ where: { id }, data: dto });
  }

  async removeRol(id: string) {
    await this.findOneRol(id);
    await this.prisma.rol.delete({ where: { id } });
    return { id, eliminado: true };
  }

  // ─── PERMISOS ─────────────────────────────────────────────────────────────────
  async findAllPermisos() {
    return this.prisma.permiso.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOnePermiso(id: string) {
    const permiso = await this.prisma.permiso.findUnique({ where: { id } });
    if (!permiso) throw new PermisoNotFoundError(id);
    return permiso;
  }

  async createPermiso(dto: CreatePermisoDto) {
    const existe = await this.prisma.permiso.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new PermisoNombreDuplicadoError(dto.nombre);
    return this.prisma.permiso.create({ data: { nombre: dto.nombre } });
  }

  async updatePermiso(id: string, dto: UpdatePermisoDto) {
    await this.findOnePermiso(id);
    if (dto.nombre) {
      const conflicto = await this.prisma.permiso.findFirst({ where: { nombre: dto.nombre, NOT: { id } } });
      if (conflicto) throw new PermisoNombreDuplicadoError(dto.nombre);
    }
    return this.prisma.permiso.update({ where: { id }, data: dto });
  }

  async removePermiso(id: string) {
    await this.findOnePermiso(id);
    await this.prisma.permiso.delete({ where: { id } });
    return { id, eliminado: true };
  }

  // ─── ASIGNACIÓN ROL ↔ PERMISO ────────────────────────────────────────────────
  async asignarPermiso(rolId: string, permisoId: string) {
    await this.findOneRol(rolId);
    await this.findOnePermiso(permisoId);

    const yaExiste = await this.prisma.rolPermiso.findUnique({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
    if (yaExiste) throw new RolPermisoYaAsignadoError(rolId, permisoId);

    return this.prisma.rolPermiso.create({ data: { rolId, permisoId } });
  }

  async revocarPermiso(rolId: string, permisoId: string) {
    await this.findOneRol(rolId);
    const rp = await this.prisma.rolPermiso.findUnique({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
    if (!rp) throw new PermisoNotFoundError(permisoId);
    await this.prisma.rolPermiso.delete({ where: { rolId_permisoId: { rolId, permisoId } } });
    return { rolId, permisoId, revocado: true };
  }

  async getPermisosDeRol(rolId: string) {
    await this.findOneRol(rolId);
    const rps = await this.prisma.rolPermiso.findMany({
      where: { rolId },
      include: { permiso: true },
      orderBy: { permiso: { nombre: 'asc' } },
    });
    return rps.map((rp) => rp.permiso);
  }
}
