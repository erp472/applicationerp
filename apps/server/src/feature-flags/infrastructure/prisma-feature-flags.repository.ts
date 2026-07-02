import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { entorno_feature_flag } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  IFeatureFlagsRepository,
  CreateFeatureFlagData,
  UpdateFeatureFlagData,
} from '../domain/feature-flags.repository.js';
import { FeatureFlagEntity } from '../domain/feature-flag.entity.js';

const SELECT = {
  idfeature_flags:          true,
  codigofeature_flags:      true,
  descripcionfeature_flags: true,
  activofeature_flags:      true,
  entornofeature_flags:     true,
  created_atfeature_flags:  true,
  updated_atfeature_flags:  true,
  roles: {
    select: {
      rol: { select: { idroles: true, codigoroles: true, nombreroles: true } },
    },
  },
  usuarios: {
    select: {
      usuario: { select: { idusuarios: true, nombreusuarios: true, emailusuarios: true } },
    },
  },
} satisfies Prisma.FeatureFlagSelect;

type FeatureFlagRow = Prisma.FeatureFlagGetPayload<{ select: typeof SELECT }>;

function toEntity(row: FeatureFlagRow): FeatureFlagEntity {
  return {
    id:          row.idfeature_flags,
    codigo:      row.codigofeature_flags,
    descripcion: row.descripcionfeature_flags,
    activo:      row.activofeature_flags,
    entorno:     row.entornofeature_flags,
    createdAt:   row.created_atfeature_flags,
    updatedAt:   row.updated_atfeature_flags,
    roles:    row.roles.map((r) => ({ id: r.rol.idroles, codigo: r.rol.codigoroles, nombre: r.rol.nombreroles })),
    usuarios: row.usuarios.map((u) => ({ id: u.usuario.idusuarios, nombre: u.usuario.nombreusuarios, email: u.usuario.emailusuarios })),
  };
}

@Injectable()
export class PrismaFeatureFlagsRepository implements IFeatureFlagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(entorno?: string): Promise<FeatureFlagEntity[]> {
    const rows = await this.prisma.featureFlag.findMany({
      where:   entorno ? { entornofeature_flags: entorno as entorno_feature_flag } : undefined,
      select:  SELECT,
      orderBy: [{ activofeature_flags: 'desc' }, { codigofeature_flags: 'asc' }],
    });
    return rows.map(toEntity);
  }

  async findById(id: number): Promise<FeatureFlagEntity | null> {
    const row = await this.prisma.featureFlag.findUnique({ where: { idfeature_flags: id }, select: SELECT });
    return row ? toEntity(row) : null;
  }

  async findByCodigo(codigo: string): Promise<FeatureFlagEntity | null> {
    const row = await this.prisma.featureFlag.findUnique({ where: { codigofeature_flags: codigo }, select: SELECT });
    return row ? toEntity(row) : null;
  }

  async findActivos(entorno: string): Promise<FeatureFlagEntity[]> {
    const rows = await this.prisma.featureFlag.findMany({
      where:  { activofeature_flags: true, entornofeature_flags: { in: ['all', entorno as entorno_feature_flag] } },
      select: SELECT,
    });
    return rows.map(toEntity);
  }

  async create(data: CreateFeatureFlagData): Promise<FeatureFlagEntity> {
    const row = await this.prisma.featureFlag.create({
      data: {
        codigofeature_flags:      data.codigo,
        descripcionfeature_flags: data.descripcion,
        activofeature_flags:      data.activo,
        entornofeature_flags:     data.entorno as entorno_feature_flag,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async update(id: number, data: UpdateFeatureFlagData): Promise<FeatureFlagEntity> {
    const row = await this.prisma.featureFlag.update({
      where: { idfeature_flags: id },
      data: {
        ...(data.descripcion !== undefined && { descripcionfeature_flags: data.descripcion }),
        ...(data.activo      !== undefined && { activofeature_flags: data.activo }),
        ...(data.entorno     !== undefined && { entornofeature_flags: data.entorno as entorno_feature_flag }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async remove(id: number): Promise<void> {
    await this.prisma.featureFlag.delete({ where: { idfeature_flags: id } });
  }

  async asignarRol(featureFlagId: number, rolId: number): Promise<void> {
    await this.prisma.featureFlagRol.upsert({
      where:  { feature_flags_idfeature_flags_roles_idroles: { feature_flags_idfeature_flags: featureFlagId, roles_idroles: rolId } },
      create: { feature_flags_idfeature_flags: featureFlagId, roles_idroles: rolId },
      update: {},
    });
  }

  async revocarRol(featureFlagId: number, rolId: number): Promise<void> {
    await this.prisma.featureFlagRol.deleteMany({
      where: { feature_flags_idfeature_flags: featureFlagId, roles_idroles: rolId },
    });
  }

  async asignarUsuario(featureFlagId: number, usuarioId: number): Promise<void> {
    await this.prisma.featureFlagUsuario.upsert({
      where:  { feature_flags_idfeature_flags_usuarios_idusuarios: { feature_flags_idfeature_flags: featureFlagId, usuarios_idusuarios: usuarioId } },
      create: { feature_flags_idfeature_flags: featureFlagId, usuarios_idusuarios: usuarioId },
      update: {},
    });
  }

  async revocarUsuario(featureFlagId: number, usuarioId: number): Promise<void> {
    await this.prisma.featureFlagUsuario.deleteMany({
      where: { feature_flags_idfeature_flags: featureFlagId, usuarios_idusuarios: usuarioId },
    });
  }
}
