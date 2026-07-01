import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFeatureFlagDto, UpdateFeatureFlagDto } from './dto/feature-flag.dto.js';
import type { entorno_feature_flag } from '../../generated/prisma/enums.js';

const SELECT = {
  idfeature_flags:        true,
  codigofeature_flags:    true,
  descripcionfeature_flags: true,
  activofeature_flags:    true,
  entornofeature_flags:   true,
  created_atfeature_flags: true,
  updated_atfeature_flags: true,
} as const;

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(entorno?: string) {
    return this.prisma.featureFlag.findMany({
      where:   entorno ? { entornofeature_flags: entorno as entorno_feature_flag } : undefined,
      select:  SELECT,
      orderBy: [{ activofeature_flags: 'desc' }, { codigofeature_flags: 'asc' }],
    });
  }

  async findOne(id: number) {
    const ff = await this.prisma.featureFlag.findUnique({ where: { idfeature_flags: id }, select: SELECT });
    if (!ff) throw new NotFoundException(`FeatureFlag ${id} no encontrado`);
    return ff;
  }

  async create(dto: CreateFeatureFlagDto) {
    const exists = await this.prisma.featureFlag.findUnique({
      where: { codigofeature_flags: dto.codigo },
    });
    if (exists) throw new ConflictException(`FeatureFlag "${dto.codigo}" ya existe`);
    return this.prisma.featureFlag.create({
      data: {
        codigofeature_flags:      dto.codigo,
        descripcionfeature_flags: dto.descripcion,
        activofeature_flags:      dto.activo,
        entornofeature_flags:     dto.entorno as entorno_feature_flag,
      },
      select: SELECT,
    });
  }

  async update(id: number, dto: UpdateFeatureFlagDto) {
    await this.findOne(id);
    return this.prisma.featureFlag.update({
      where: { idfeature_flags: id },
      data: {
        ...(dto.descripcion !== undefined && { descripcionfeature_flags: dto.descripcion }),
        ...(dto.activo      !== undefined && { activofeature_flags: dto.activo }),
        ...(dto.entorno     !== undefined && { entornofeature_flags: dto.entorno as entorno_feature_flag }),
      },
      select: SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.featureFlag.delete({ where: { idfeature_flags: id } });
    return { id, eliminado: true };
  }

  getActivos(entorno: string) {
    return this.prisma.featureFlag.findMany({
      where:  { activofeature_flags: true, entornofeature_flags: { in: ['all', entorno as entorno_feature_flag] } },
      select: { codigofeature_flags: true, entornofeature_flags: true },
    });
  }
}
