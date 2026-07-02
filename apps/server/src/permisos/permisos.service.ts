import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRolDto, UpdateRolDto, CreatePermisoDto, UpdatePermisoDto } from './dto/permisos.dto.js';

const ROL_SELECT = {
  idroles:      true,
  codigoroles:  true,
  nombreroles:  true,
  activoroles:  true,
  created_atroles: true,
  rolesPermisos: {
    select: {
      permisos_idpermisos: true,
      permiso: {
        select: {
          idpermisos:          true,
          codigopermisos:      true,
          descripcionpermisos: true,
          modulopermisos:      true,
        },
      },
    },
  },
} as const;

const PERMISO_SELECT = {
  idpermisos:          true,
  codigopermisos:      true,
  descripcionpermisos: true,
  modulopermisos:      true,
} as const;

@Injectable()
export class PermisosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── ROLES ──────────────────────────────────────────────────────────────────

  async findAllRoles() {
    return this.prisma.rol.findMany({
      where:   { activoroles: true },
      select:  ROL_SELECT,
      orderBy: { nombreroles: 'asc' },
    });
  }

  async findOneRol(id: number) {
    const rol = await this.prisma.rol.findUnique({ where: { idroles: id }, select: ROL_SELECT });
    if (!rol) throw new NotFoundException(`Rol ${id} no encontrado`);
    return rol;
  }

  async createRol(dto: CreateRolDto) {
    const exists = await this.prisma.rol.findUnique({ where: { codigoroles: dto.codigoroles } });
    if (exists) throw new ConflictException(`El rol "${dto.codigoroles}" ya existe`);
    return this.prisma.rol.create({ data: dto, select: ROL_SELECT });
  }

  async updateRol(id: number, dto: UpdateRolDto) {
    await this.findOneRol(id);
    return this.prisma.rol.update({ where: { idroles: id }, data: dto, select: ROL_SELECT });
  }

  async deleteRol(id: number) {
    await this.findOneRol(id);
    await this.prisma.rol.delete({ where: { idroles: id } });
    return { id, eliminado: true };
  }

  // ── PERMISOS ───────────────────────────────────────────────────────────────

  async findAllPermisos(modulo?: string) {
    return this.prisma.permiso.findMany({
      where:   modulo ? { modulopermisos: modulo } : undefined,
      select:  PERMISO_SELECT,
      orderBy: [{ modulopermisos: 'asc' }, { codigopermisos: 'asc' }],
    });
  }

  async createPermiso(dto: CreatePermisoDto) {
    const exists = await this.prisma.permiso.findUnique({ where: { codigopermisos: dto.codigopermisos } });
    if (exists) throw new ConflictException(`El permiso "${dto.codigopermisos}" ya existe`);
    return this.prisma.permiso.create({ data: dto, select: PERMISO_SELECT });
  }

  async updatePermiso(id: number, dto: UpdatePermisoDto) {
    const p = await this.prisma.permiso.findUnique({ where: { idpermisos: id } });
    if (!p) throw new NotFoundException(`Permiso ${id} no encontrado`);
    return this.prisma.permiso.update({ where: { idpermisos: id }, data: dto, select: PERMISO_SELECT });
  }

  async deletePermiso(id: number) {
    const p = await this.prisma.permiso.findUnique({ where: { idpermisos: id } });
    if (!p) throw new NotFoundException(`Permiso ${id} no encontrado`);
    await this.prisma.permiso.delete({ where: { idpermisos: id } });
    return { id, eliminado: true };
  }

  // ── ASIGNACIONES ───────────────────────────────────────────────────────────

  async getPermisosDeRol(rolId: number) {
    await this.findOneRol(rolId);
    return this.prisma.rolPermiso.findMany({
      where:  { roles_idroles: rolId },
      select: {
        permisos_idpermisos: true,
        permiso: { select: PERMISO_SELECT },
      },
    });
  }

  async asignarPermiso(rolId: number, permisoId: number) {
    await this.findOneRol(rolId);
    const p = await this.prisma.permiso.findUnique({ where: { idpermisos: permisoId } });
    if (!p) throw new NotFoundException(`Permiso ${permisoId} no encontrado`);

    const exists = await this.prisma.rolPermiso.findUnique({
      where: { roles_idroles_permisos_idpermisos: { roles_idroles: rolId, permisos_idpermisos: permisoId } },
    });
    if (exists) return exists;

    return this.prisma.rolPermiso.create({
      data: { roles_idroles: rolId, permisos_idpermisos: permisoId },
    });
  }

  async revocarPermiso(rolId: number, permisoId: number) {
    const entry = await this.prisma.rolPermiso.findUnique({
      where: { roles_idroles_permisos_idpermisos: { roles_idroles: rolId, permisos_idpermisos: permisoId } },
    });
    if (!entry) throw new NotFoundException('Asignación no encontrada');
    await this.prisma.rolPermiso.delete({
      where: { roles_idroles_permisos_idpermisos: { roles_idroles: rolId, permisos_idpermisos: permisoId } },
    });
    return { rolId, permisoId, revocado: true };
  }

  // ── MATRIX ─────────────────────────────────────────────────────────────────

  async getMatrix() {
    const [permisosByModulo, roles] = await Promise.all([
      this.prisma.permiso.findMany({
        select:  PERMISO_SELECT,
        orderBy: [{ modulopermisos: 'asc' }, { codigopermisos: 'asc' }],
      }),
      this.prisma.rol.findMany({
        where:   { activoroles: true },
        select: {
          idroles:  true,
          codigoroles: true,
          nombreroles: true,
          rolesPermisos: { select: { permisos_idpermisos: true } },
        },
        orderBy: { nombreroles: 'asc' },
      }),
    ]);

    const modulosMap = new Map<string, typeof permisosByModulo>();
    for (const p of permisosByModulo) {
      if (!modulosMap.has(p.modulopermisos)) modulosMap.set(p.modulopermisos, []);
      modulosMap.get(p.modulopermisos)!.push(p);
    }

    const modulos = Array.from(modulosMap.entries()).map(([nombre, permisos], orden) => ({
      id:          nombre,
      nombre:      nombre.charAt(0).toUpperCase() + nombre.slice(1),
      descripcion: null as string | null,
      orden,
      permisos:    permisos.map((p) => ({
        id:          p.idpermisos,
        nombre:      p.codigopermisos,
        descripcion: p.descripcionpermisos,
      })),
    }));

    return {
      modulos,
      roles: roles.map((r) => ({
        id:          r.idroles,
        nombre:      r.nombreroles,
        descripcion: null as string | null,
        permisoIds:  r.rolesPermisos.map((rp) => rp.permisos_idpermisos),
      })),
    };
  }
}
