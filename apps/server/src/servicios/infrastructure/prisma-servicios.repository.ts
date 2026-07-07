import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IServiciosRepository } from '../domain/servicio.repository.js';
import type { ServicioEntity, ServicioSucursalEntity } from '../domain/servicio.entity.js';
import type { QueryServicioDto } from '../dto/query-servicio.dto.js';

const SELECT = {
  idservicios:                       true,
  codigoservicios:                   true,
  nombreservicios:                   true,
  descripcionservicios:              true,
  tiposervicios:                     true,
  requiere_estampillaservicios:      true,
  requiere_dimensionesservicios:     true,
  requiere_valor_declaradoservicios: true,
  peso_maximo_kgservicios:           true,
  factor_volumetricoservicios:       true,
  tiempo_entrega_diasservicios:      true,
  codigo_sigmaservicios:             true,
  activoservicios:                   true,
  created_atservicios:               true,
} satisfies Prisma.ServicioSelect;

type ServicioRow = Prisma.ServicioGetPayload<{ select: typeof SELECT }>;

const SELECT_SS = {
  sucursales_idsucursales:  true,
  servicios_idservicios:    true,
  activoservicios_sucursal: true,
  sucursal: {
    select: { idsucursales: true, codigosucursales: true, nombresucursales: true },
  },
} satisfies Prisma.ServicioSucursalSelect;

type ServicioSucursalRow = Prisma.ServicioSucursalGetPayload<{ select: typeof SELECT_SS }>;

function toEntity(row: ServicioRow): ServicioEntity {
  return {
    id:                    row.idservicios,
    codigo:                row.codigoservicios,
    nombre:                row.nombreservicios,
    descripcion:           row.descripcionservicios ?? null,
    tipo:                  row.tiposervicios as ServicioEntity['tipo'],
    requiereEstampilla:    row.requiere_estampillaservicios,
    requiereDimensiones:   row.requiere_dimensionesservicios,
    requiereValorDeclarado: row.requiere_valor_declaradoservicios,
    pesoMaximoKg:          row.peso_maximo_kgservicios !== null ? Number(row.peso_maximo_kgservicios) : null,
    factorVolumetrico:     row.factor_volumetricoservicios,
    tiempoEntregaDias:     row.tiempo_entrega_diasservicios ?? null,
    codigoSigma:           row.codigo_sigmaservicios ?? null,
    activo:                row.activoservicios,
    createdAt:             row.created_atservicios,
  };
}

function toSucursalEntity(row: ServicioSucursalRow): ServicioSucursalEntity {
  return {
    sucursalId: row.sucursales_idsucursales,
    servicioId: row.servicios_idservicios,
    activo:     row.activoservicios_sucursal,
    sucursal: {
      id:     row.sucursal.idsucursales,
      codigo: row.sucursal.codigosucursales,
      nombre: row.sucursal.nombresucursales,
    },
  };
}

@Injectable()
export class PrismaServiciosRepository implements IServiciosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Parameters<IServiciosRepository['create']>[0]): Promise<ServicioEntity> {
    const row = await this.prisma.servicio.create({
      data: {
        codigoservicios:                   data.codigo,
        nombreservicios:                   data.nombre,
        descripcionservicios:              data.descripcion ?? null,
        tiposervicios:                     data.tipo as any,
        requiere_estampillaservicios:      data.requiereEstampilla,
        requiere_dimensionesservicios:     data.requiereDimensiones,
        requiere_valor_declaradoservicios: data.requiereValorDeclarado,
        peso_maximo_kgservicios:           data.pesoMaximoKg ?? null,
        factor_volumetricoservicios:       data.factorVolumetrico,
        tiempo_entrega_diasservicios:      data.tiempoEntregaDias ?? null,
        codigo_sigmaservicios:             data.codigoSigma ?? null,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QueryServicioDto): Promise<{ datos: ServicioEntity[]; total: number }> {
    const { tipo, activo, buscar, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.ServicioWhereInput = {
      deleted_atservicios: null,
      ...(tipo   !== undefined && { tiposervicios:   tipo }),
      ...(activo !== undefined && { activoservicios: activo }),
      ...(buscar && {
        OR: [
          { codigoservicios:  { contains: buscar, mode: 'insensitive' } },
          { nombreservicios:  { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.servicio.count({ where }),
      this.prisma.servicio.findMany({
        where, select: SELECT, orderBy: { created_atservicios: 'desc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<ServicioEntity | null> {
    const row = await this.prisma.servicio.findFirst({
      where: { idservicios: id, deleted_atservicios: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async codigoExists(codigo: string): Promise<boolean> {
    const count = await this.prisma.servicio.count({
      where: { codigoservicios: codigo, deleted_atservicios: null },
    });
    return count > 0;
  }

  async update(id: number, data: Parameters<IServiciosRepository['update']>[1]): Promise<ServicioEntity> {
    const row = await this.prisma.servicio.update({
      where: { idservicios: id },
      data: {
        ...(data.nombre                !== undefined && { nombreservicios:                   data.nombre }),
        ...(data.descripcion           !== undefined && { descripcionservicios:              data.descripcion }),
        ...(data.requiereEstampilla    !== undefined && { requiere_estampillaservicios:      data.requiereEstampilla }),
        ...(data.requiereDimensiones   !== undefined && { requiere_dimensionesservicios:     data.requiereDimensiones }),
        ...(data.requiereValorDeclarado !== undefined && { requiere_valor_declaradoservicios: data.requiereValorDeclarado }),
        ...(data.pesoMaximoKg          !== undefined && { peso_maximo_kgservicios:           data.pesoMaximoKg }),
        ...(data.factorVolumetrico     !== undefined && { factor_volumetricoservicios:       data.factorVolumetrico }),
        ...(data.tiempoEntregaDias     !== undefined && { tiempo_entrega_diasservicios:      data.tiempoEntregaDias }),
        ...(data.codigoSigma           !== undefined && { codigo_sigmaservicios:             data.codigoSigma }),
        ...(data.activo                !== undefined && { activoservicios:                   data.activo }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<ServicioEntity> {
    const row = await this.prisma.servicio.update({
      where: { idservicios: id },
      data:  { activoservicios: false, deleted_atservicios: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }

  async assignSucursal(servicioId: number, sucursalId: number): Promise<ServicioSucursalEntity> {
    const row = await this.prisma.servicioSucursal.create({
      data: { servicios_idservicios: servicioId, sucursales_idsucursales: sucursalId },
      select: SELECT_SS,
    });
    return toSucursalEntity(row);
  }

  async unassignSucursal(servicioId: number, sucursalId: number): Promise<void> {
    await this.prisma.servicioSucursal.delete({
      where: {
        sucursales_idsucursales_servicios_idservicios: {
          sucursales_idsucursales: sucursalId,
          servicios_idservicios:   servicioId,
        },
      },
    });
  }

  async findSucursalesByServicio(servicioId: number): Promise<ServicioSucursalEntity[]> {
    const rows = await this.prisma.servicioSucursal.findMany({
      where:   { servicios_idservicios: servicioId, activoservicios_sucursal: true },
      select:  SELECT_SS,
      orderBy: { sucursal: { nombresucursales: 'asc' } },
    });
    return rows.map(toSucursalEntity);
  }

  async sucursalExists(sucursalId: number): Promise<boolean> {
    const count = await this.prisma.sucursal.count({
      where: { idsucursales: sucursalId, deleted_atsucursales: null },
    });
    return count > 0;
  }

  async isAssigned(servicioId: number, sucursalId: number): Promise<boolean> {
    const count = await this.prisma.servicioSucursal.count({
      where: { servicios_idservicios: servicioId, sucursales_idsucursales: sucursalId },
    });
    return count > 0;
  }
}
