import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IServiciosRepository } from '../domain/servicio.repository.js';
import type { CreateTarifaData, UpdateTarifaData } from '../domain/servicio.repository.js';
import type { ServicioEntity, ServicioSucursalEntity, TarifaEnvioEntity } from '../domain/servicio.entity.js';
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
  tarifa_certificacionservicios:     true,
  minimo_seguro_postalservicios:     true,
  alto_max_cmservicios:              true,
  ancho_max_cmservicios:             true,
  largo_max_cmservicios:             true,
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

const SELECT_TARIFA = {
  idtarifas_servicio:                    true,
  servicios_idservicios:                 true,
  pais_destinotarifas_servicio:          true,
  ciudad_destinotarifas_servicio:        true,
  peso_min_kgtarifas_servicio:           true,
  peso_max_kgtarifas_servicio:           true,
  tarifatarifas_servicio:                true,
  tarifa_kg_adicionaltarifas_servicio:   true,
  activatarifas_servicio:                true,
  fecha_vigencia_iniciotarifas_servicio: true,
  fecha_vigencia_fintarifas_servicio:    true,
} satisfies Prisma.TarifaServicioSelect;

type TarifaRow = Prisma.TarifaServicioGetPayload<{ select: typeof SELECT_TARIFA }>;

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
    tarifaCertificacion:   row.tarifa_certificacionservicios !== null ? Number(row.tarifa_certificacionservicios) : null,
    minimoSeguroPostal:    row.minimo_seguro_postalservicios !== null && row.minimo_seguro_postalservicios !== undefined ? Number(row.minimo_seguro_postalservicios) : null,
    altoMaxCm:             row.alto_max_cmservicios  !== null && row.alto_max_cmservicios  !== undefined ? Number(row.alto_max_cmservicios)  : null,
    anchoMaxCm:            row.ancho_max_cmservicios !== null && row.ancho_max_cmservicios !== undefined ? Number(row.ancho_max_cmservicios) : null,
    largoMaxCm:            row.largo_max_cmservicios !== null && row.largo_max_cmservicios !== undefined ? Number(row.largo_max_cmservicios) : null,
    activo:                row.activoservicios,
    createdAt:             row.created_atservicios,
  };
}

function toTarifaEntity(row: TarifaRow): TarifaEnvioEntity {
  return {
    id:                row.idtarifas_servicio,
    servicioId:        row.servicios_idservicios,
    paisDestino:       row.pais_destinotarifas_servicio,
    ciudadDestino:     row.ciudad_destinotarifas_servicio ?? null,
    pesoMinKg:         Number(row.peso_min_kgtarifas_servicio),
    pesoMaxKg:         row.peso_max_kgtarifas_servicio !== null ? Number(row.peso_max_kgtarifas_servicio) : null,
    tarifa:            Number(row.tarifatarifas_servicio),
    tarifaKgAdicional: row.tarifa_kg_adicionaltarifas_servicio !== null ? Number(row.tarifa_kg_adicionaltarifas_servicio) : null,
    activa:            row.activatarifas_servicio,
    vigenciaInicio:    row.fecha_vigencia_iniciotarifas_servicio ?? null,
    vigenciaFin:       row.fecha_vigencia_fintarifas_servicio ?? null,
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
        minimo_seguro_postalservicios:     data.minimoSeguroPostal ?? null,
        alto_max_cmservicios:              data.altoMaxCm ?? null,
        ancho_max_cmservicios:             data.anchoMaxCm ?? null,
        largo_max_cmservicios:             data.largoMaxCm ?? null,
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
        ...(data.minimoSeguroPostal    !== undefined && { minimo_seguro_postalservicios:     data.minimoSeguroPostal }),
        ...(data.altoMaxCm             !== undefined && { alto_max_cmservicios:              data.altoMaxCm }),
        ...(data.anchoMaxCm            !== undefined && { ancho_max_cmservicios:             data.anchoMaxCm }),
        ...(data.largoMaxCm            !== undefined && { largo_max_cmservicios:             data.largoMaxCm }),
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

  async findTarifasByServicio(servicioId: number): Promise<TarifaEnvioEntity[]> {
    const rows = await this.prisma.tarifaServicio.findMany({
      where:   { servicios_idservicios: servicioId, deleted_attarifas_servicio: null },
      select:  SELECT_TARIFA,
      orderBy: [
        { pais_destinotarifas_servicio: 'asc' },
        { peso_min_kgtarifas_servicio: 'asc' },
      ],
    });
    return rows.map(toTarifaEntity);
  }

  async createTarifa(servicioId: number, data: CreateTarifaData): Promise<TarifaEnvioEntity> {
    const row = await this.prisma.tarifaServicio.create({
      data: {
        servicios_idservicios:               servicioId,
        pais_destinotarifas_servicio:        data.paisDestino,
        ciudad_destinotarifas_servicio:      data.ciudadDestino ?? null,
        peso_min_kgtarifas_servicio:         data.pesoMinKg,
        peso_max_kgtarifas_servicio:         data.pesoMaxKg ?? null,
        tarifatarifas_servicio:              data.tarifa,
        tarifa_kg_adicionaltarifas_servicio: data.tarifaKgAdicional ?? null,
        activatarifas_servicio:              true,
      },
      select: SELECT_TARIFA,
    });
    return toTarifaEntity(row);
  }

  async updateTarifa(tarifaId: number, data: UpdateTarifaData): Promise<TarifaEnvioEntity> {
    const row = await this.prisma.tarifaServicio.update({
      where: { idtarifas_servicio: tarifaId },
      data: {
        ...(data.tarifa             !== undefined && { tarifatarifas_servicio:              data.tarifa }),
        ...(data.tarifaKgAdicional  !== undefined && { tarifa_kg_adicionaltarifas_servicio: data.tarifaKgAdicional }),
        ...(data.activa             !== undefined && { activatarifas_servicio:              data.activa }),
      },
      select: SELECT_TARIFA,
    });
    return toTarifaEntity(row);
  }

  async deleteTarifa(tarifaId: number): Promise<void> {
    await this.prisma.tarifaServicio.update({
      where: { idtarifas_servicio: tarifaId },
      data:  { deleted_attarifas_servicio: new Date() },
    });
  }

  async updateCertificacion(servicioId: number, tarifa: number | null): Promise<ServicioEntity> {
    const row = await this.prisma.servicio.update({
      where: { idservicios: servicioId },
      data:  { tarifa_certificacionservicios: tarifa },
      select: SELECT,
    });
    return toEntity(row);
  }
}
