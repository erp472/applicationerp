import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CrearFranquiciaDto,
  ActualizarFranquiciaDto,
} from '../dto/franquicia.dto.js';

const SELECT = {
  idfranquicias:     true,
  codigofranquicias: true,
  nombrefranquicias: true,
  activofranquicias: true,
} as const;

export interface FranquiciaEntity {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

function toEntity(row: {
  idfranquicias: number;
  codigofranquicias: string;
  nombrefranquicias: string;
  activofranquicias: boolean;
}): FranquiciaEntity {
  return {
    id:     row.idfranquicias,
    codigo: row.codigofranquicias,
    nombre: row.nombrefranquicias,
    activo: row.activofranquicias,
  };
}

@Injectable()
export class FranquiciasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lo que el cajero puede ofrecer en el datáfono de su punto */
  async listarPorSucursal(sucursalId: number): Promise<FranquiciaEntity[]> {
    const rows = await this.prisma.franquiciaSucursal.findMany({
      where: {
        sucursales_idsucursales:    sucursalId,
        activofranquicias_sucursal: true,
        franquicia: { activofranquicias: true, deleted_atfranquicias: null },
      },
      select: { franquicia: { select: SELECT } },
      orderBy: { franquicia: { nombrefranquicias: 'asc' } },
    });
    return rows.map(r => toEntity(r.franquicia));
  }

  /** Catálogo completo — vista de Tesorería */
  async listarCatalogo(): Promise<(FranquiciaEntity & { sucursalesActivas: number[] })[]> {
    const rows = await this.prisma.franquicia.findMany({
      where:   { deleted_atfranquicias: null },
      select:  { ...SELECT, franquiciasSucursal: { where: { activofranquicias_sucursal: true }, select: { sucursales_idsucursales: true } } },
      orderBy: { nombrefranquicias: 'asc' },
    });
    return rows.map(r => ({
      ...toEntity(r),
      sucursalesActivas: r.franquiciasSucursal.map(fs => fs.sucursales_idsucursales),
    }));
  }

  async crear(dto: CrearFranquiciaDto): Promise<FranquiciaEntity> {
    const existente = await this.prisma.franquicia.findUnique({
      where:  { codigofranquicias: dto.codigo },
      select: { idfranquicias: true, deleted_atfranquicias: true },
    });
    if (existente && !existente.deleted_atfranquicias) {
      throw new ConflictException(`Ya existe una franquicia con código ${dto.codigo}`);
    }
    // Reutiliza el registro borrado en vez de chocar contra el índice único del código
    if (existente) {
      const row = await this.prisma.franquicia.update({
        where:  { idfranquicias: existente.idfranquicias },
        data:   { nombrefranquicias: dto.nombre, activofranquicias: dto.activo, deleted_atfranquicias: null },
        select: SELECT,
      });
      return toEntity(row);
    }
    const row = await this.prisma.franquicia.create({
      data:   { codigofranquicias: dto.codigo, nombrefranquicias: dto.nombre, activofranquicias: dto.activo },
      select: SELECT,
    });
    return toEntity(row);
  }

  async actualizar(id: number, dto: ActualizarFranquiciaDto): Promise<FranquiciaEntity> {
    await this.getOrThrow(id);
    const row = await this.prisma.franquicia.update({
      where: { idfranquicias: id },
      data: {
        nombrefranquicias:     dto.nombre,
        activofranquicias:     dto.activo,
        updated_atfranquicias: new Date(),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async eliminar(id: number): Promise<{ id: number }> {
    await this.getOrThrow(id);
    await this.prisma.franquicia.update({
      where: { idfranquicias: id },
      data:  { deleted_atfranquicias: new Date(), activofranquicias: false },
    });
    return { id };
  }

  async activarEnSucursal(id: number, sucursalId: number, activo: boolean) {
    await this.getOrThrow(id);
    await this.prisma.franquiciaSucursal.upsert({
      where:  { sucursales_idsucursales_franquicias_idfranquicias: { sucursales_idsucursales: sucursalId, franquicias_idfranquicias: id } },
      create: { sucursales_idsucursales: sucursalId, franquicias_idfranquicias: id, activofranquicias_sucursal: activo },
      update: { activofranquicias_sucursal: activo },
    });
    return { franquiciaId: id, sucursalId, activo };
  }

  private async getOrThrow(id: number) {
    const row = await this.prisma.franquicia.findFirst({
      where:  { idfranquicias: id, deleted_atfranquicias: null },
      select: SELECT,
    });
    if (!row) throw new NotFoundException(`Franquicia ${id} no encontrada`);
    return row;
  }
}
