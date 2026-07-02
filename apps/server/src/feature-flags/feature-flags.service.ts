import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFeatureFlagDto, UpdateFeatureFlagDto } from './dto/feature-flag.dto.js';
import type { entorno_feature_flag, plataforma_feature_flag } from '../../generated/prisma/enums.js';

const SELECT = {
  idfeature_flags:          true,
  codigofeature_flags:      true,
  descripcionfeature_flags: true,
  activofeature_flags:      true,
  entornofeature_flags:     true,
  plataformafeature_flags:  true,
  created_atfeature_flags:  true,
  updated_atfeature_flags:  true,
  featureFlagRoles: {
    select: { rol: { select: { codigoroles: true } } },
  },
} as const;

function toResponse(ff: {
  idfeature_flags: number;
  codigofeature_flags: string;
  descripcionfeature_flags: string | null;
  activofeature_flags: boolean;
  entornofeature_flags: string;
  plataformafeature_flags: string;
  created_atfeature_flags: Date;
  updated_atfeature_flags: Date;
  featureFlagRoles: { rol: { codigoroles: string } }[];
}) {
  return {
    id:          ff.idfeature_flags,
    codigo:      ff.codigofeature_flags,
    descripcion: ff.descripcionfeature_flags,
    activo:      ff.activofeature_flags,
    entorno:     ff.entornofeature_flags,
    plataforma:  ff.plataformafeature_flags,
    roles:       ff.featureFlagRoles.map(r => r.rol.codigoroles),
    createdAt:   ff.created_atfeature_flags,
    updatedAt:   ff.updated_atfeature_flags,
  };
}

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(entorno?: string) {
    const flags = await this.prisma.featureFlag.findMany({
      where:   entorno ? { entornofeature_flags: entorno as entorno_feature_flag } : undefined,
      select:  SELECT,
      orderBy: [{ activofeature_flags: 'desc' }, { codigofeature_flags: 'asc' }],
    });
    return flags.map(toResponse);
  }

  async findOne(id: number) {
    const ff = await this.prisma.featureFlag.findUnique({ where: { idfeature_flags: id }, select: SELECT });
    if (!ff) throw new NotFoundException(`FeatureFlag ${id} no encontrado`);
    return toResponse(ff);
  }

  async create(dto: CreateFeatureFlagDto) {
    const exists = await this.prisma.featureFlag.findUnique({
      where: { codigofeature_flags: dto.codigo },
    });
    if (exists) throw new ConflictException(`FeatureFlag "${dto.codigo}" ya existe`);

    const roles = await this.resolveRoleIds(dto.roles);

    const ff = await this.prisma.featureFlag.create({
      data: {
        codigofeature_flags:      dto.codigo,
        descripcionfeature_flags: dto.descripcion,
        activofeature_flags:      dto.activo,
        entornofeature_flags:     dto.entorno as entorno_feature_flag,
        plataformafeature_flags:  dto.plataforma as plataforma_feature_flag,
        featureFlagRoles: roles.length
          ? { create: roles.map(id => ({ roles_idroles: id })) }
          : undefined,
      },
      select: SELECT,
    });
    return toResponse(ff);
  }

  async update(id: number, dto: UpdateFeatureFlagDto) {
    await this.findOne(id);

    const ff = await this.prisma.featureFlag.update({
      where: { idfeature_flags: id },
      data: {
        ...(dto.descripcion !== undefined && { descripcionfeature_flags: dto.descripcion }),
        ...(dto.activo      !== undefined && { activofeature_flags: dto.activo }),
        ...(dto.entorno     !== undefined && { entornofeature_flags: dto.entorno as entorno_feature_flag }),
        ...(dto.plataforma  !== undefined && { plataformafeature_flags: dto.plataforma as plataforma_feature_flag }),
        ...(dto.roles !== undefined && {
          featureFlagRoles: {
            deleteMany: {},
            create: (await this.resolveRoleIds(dto.roles)).map(rid => ({ roles_idroles: rid })),
          },
        }),
      },
      select: SELECT,
    });
    return toResponse(ff);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.featureFlag.delete({ where: { idfeature_flags: id } });
    return { id, eliminado: true };
  }

  // Endpoint para el cliente: devuelve flags activos filtrados por entorno, plataforma y rol
  async getActivos(entorno: string, plataforma: string, rolCodigo: string) {
    const flags = await this.prisma.featureFlag.findMany({
      where: {
        activofeature_flags:     true,
        entornofeature_flags:    { in: ['all', entorno as entorno_feature_flag] },
        plataformafeature_flags: { in: ['all', plataforma as plataforma_feature_flag] },
        OR: [
          { featureFlagRoles: { none: {} } },
          { featureFlagRoles: { some: { rol: { codigoroles: rolCodigo } } } },
        ],
      },
      select: {
        codigofeature_flags:     true,
        entornofeature_flags:    true,
        plataformafeature_flags: true,
      },
      orderBy: { codigofeature_flags: 'asc' },
    });

    return flags.map(f => ({
      codigo:     f.codigofeature_flags,
      entorno:    f.entornofeature_flags,
      plataforma: f.plataformafeature_flags,
    }));
  }

  private async resolveRoleIds(codigos: string[]): Promise<number[]> {
    if (!codigos.length) return [];
    const roles = await this.prisma.rol.findMany({
      where:  { codigoroles: { in: codigos } },
      select: { idroles: true },
    });
    return roles.map(r => r.idroles);
  }
}
