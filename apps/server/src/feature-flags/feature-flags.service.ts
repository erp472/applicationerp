import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFeatureFlagDto, UpdateFeatureFlagDto } from './dto/feature-flag.dto.js';
import type { EntornoFeatureFlag } from '../../generated/prisma/enums.js';

const SELECT = {
  id: true, codigo: true, descripcion: true, activo: true, entorno: true,
  createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(entorno?: string) {
    return this.prisma.featureFlag.findMany({
      where: entorno ? { entorno: entorno as EntornoFeatureFlag } : undefined,
      select: SELECT,
      orderBy: [{ activo: 'desc' }, { codigo: 'asc' }],
    });
  }

  async findOne(id: string) {
    const ff = await this.prisma.featureFlag.findUnique({ where: { id }, select: SELECT });
    if (!ff) throw new NotFoundException(`FeatureFlag ${id} no encontrado`);
    return ff;
  }

  async create(dto: CreateFeatureFlagDto) {
    const exists = await this.prisma.featureFlag.findUnique({ where: { codigo: dto.codigo } });
    if (exists) throw new ConflictException(`FeatureFlag "${dto.codigo}" ya existe`);
    return this.prisma.featureFlag.create({
      data: { ...dto, entorno: dto.entorno as EntornoFeatureFlag },
      select: SELECT,
    });
  }

  async update(id: string, dto: UpdateFeatureFlagDto) {
    await this.findOne(id);
    return this.prisma.featureFlag.update({
      where: { id },
      data: { ...dto, ...(dto.entorno && { entorno: dto.entorno as EntornoFeatureFlag }) },
      select: SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.featureFlag.delete({ where: { id } });
    return { id, eliminado: true };
  }

  // Endpoint liviano para el frontend: flags activos del entorno actual
  getActivos(entorno: string) {
    return this.prisma.featureFlag.findMany({
      where: { activo: true, entorno: { in: ['all', entorno as EntornoFeatureFlag] } },
      select: { codigo: true, entorno: true },
    });
  }
}
