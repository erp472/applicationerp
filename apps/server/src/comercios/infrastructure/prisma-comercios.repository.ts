import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IComerciosRepository } from '../domain/comercio.repository.js';
import type { ComercioEntity } from '../domain/comercio.entity.js';
import type { QueryComercioDto } from '../dto/query-comercio.dto.js';

const SELECT = {
  idcomercios:         true,
  codigocomercios:     true,
  nombrecomercios:     true,
  nitcomercios:        true,
  activocomercios:     true,
  created_atcomercios: true,
} satisfies Prisma.ComercioSelect;

type ComercioRow = Prisma.ComercioGetPayload<{ select: typeof SELECT }>;

function toEntity(row: ComercioRow): ComercioEntity {
  return {
    id:        row.idcomercios,
    codigo:    row.codigocomercios,
    nombre:    row.nombrecomercios,
    nit:       row.nitcomercios,
    activo:    row.activocomercios,
    createdAt: row.created_atcomercios,
  };
}

@Injectable()
export class PrismaComerciosRepository implements IComerciosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { codigo: string; nombre: string; nit: string }): Promise<ComercioEntity> {
    const row = await this.prisma.comercio.create({
      data: {
        codigocomercios: data.codigo,
        nombrecomercios: data.nombre,
        nitcomercios:    data.nit,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QueryComercioDto): Promise<{ datos: ComercioEntity[]; total: number }> {
    const { buscar, activo, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.ComercioWhereInput = {
      deleted_atcomercios: null,
      ...(activo !== undefined && { activocomercios: activo }),
      ...(buscar && {
        OR: [
          { nombrecomercios:  { contains: buscar, mode: 'insensitive' } },
          { codigocomercios:  { contains: buscar, mode: 'insensitive' } },
          { nitcomercios:     { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.comercio.count({ where }),
      this.prisma.comercio.findMany({
        where, select: SELECT, orderBy: { nombrecomercios: 'asc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<ComercioEntity | null> {
    const row = await this.prisma.comercio.findFirst({
      where: { idcomercios: id, deleted_atcomercios: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByCodigo(codigo: string): Promise<ComercioEntity | null> {
    const row = await this.prisma.comercio.findFirst({
      where: { codigocomercios: codigo, deleted_atcomercios: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByNit(nit: string): Promise<ComercioEntity | null> {
    const row = await this.prisma.comercio.findFirst({
      where: { nitcomercios: nit, deleted_atcomercios: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByNitExcluding(nit: string, excludeId: number): Promise<ComercioEntity | null> {
    const row = await this.prisma.comercio.findFirst({
      where: { nitcomercios: nit, deleted_atcomercios: null, NOT: { idcomercios: excludeId } },
      select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async countActiveRegionales(comercioId: number): Promise<number> {
    return this.prisma.regional.count({
      where: { comercios_idcomercios: comercioId, deleted_atregionales: null, activoregionales: true },
    });
  }

  async update(id: number, data: { nombre?: string; nit?: string; activo?: boolean }): Promise<ComercioEntity> {
    const row = await this.prisma.comercio.update({
      where: { idcomercios: id },
      data: {
        ...(data.nombre !== undefined && { nombrecomercios: data.nombre }),
        ...(data.nit    !== undefined && { nitcomercios:    data.nit }),
        ...(data.activo !== undefined && { activocomercios: data.activo }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<ComercioEntity> {
    const row = await this.prisma.comercio.update({
      where: { idcomercios: id },
      data:  { activocomercios: false, deleted_atcomercios: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }
}
