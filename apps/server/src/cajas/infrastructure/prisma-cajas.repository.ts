import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ICajasRepository, CreateCajaData, UpdateCajaData, CreateCajaPadreData, UpdateCajaPadreData } from '../domain/caja.repository.js';
import type { CajaEntity, CajaPadreEntity } from '../domain/caja.entity.js';

const SELECT_CAJA = {
  idcajas:                     true,
  sucursales_idsucursales:     true,
  cajas_padres_idcajas_padres: true,
  codigocajas:                 true,
  nombrecajas:                 true,
  tipocajas:                   true,
  base_diacajas:               true,
  limite_alertacajas:          true,
  activocajas:                 true,
} satisfies Prisma.CajaSelect;

type CajaRow = Prisma.CajaGetPayload<{ select: typeof SELECT_CAJA }>;

function toEntity(row: CajaRow): CajaEntity {
  return {
    id:           row.idcajas,
    sucursalId:   row.sucursales_idsucursales,
    cajaPadreId:  row.cajas_padres_idcajas_padres,
    codigo:       row.codigocajas,
    nombre:       row.nombrecajas,
    tipo:         row.tipocajas as CajaEntity['tipo'],
    baseDia:      row.base_diacajas.toString(),
    limiteAlerta: row.limite_alertacajas ? row.limite_alertacajas.toString() : null,
    activo:       row.activocajas,
  };
}

const SELECT_PADRE = {
  idcajas_padres:           true,
  sucursales_idsucursales:  true,
  nombrecajas_padres:       true,
  base_generalcajas_padres: true,
  hora_resetcajas_padres:   true,
} satisfies Prisma.CajaPadreSelect;

type CajaPadreRow = Prisma.CajaPadreGetPayload<{ select: typeof SELECT_PADRE }>;

function toPadreEntity(row: CajaPadreRow): CajaPadreEntity {
  return {
    id:          row.idcajas_padres,
    sucursalId:  row.sucursales_idsucursales,
    nombre:      row.nombrecajas_padres,
    baseGeneral: row.base_generalcajas_padres.toString(),
    horaReset:   row.hora_resetcajas_padres,
  };
}

function parseHoraReset(horaReset: string): Date {
  const [h, m] = horaReset.split(':');
  const d = new Date(0);
  d.setUTCHours(+h, +m, 0, 0);
  return d;
}

@Injectable()
export class PrismaCajasRepository implements ICajasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<CajaEntity | null> {
    const row = await this.prisma.caja.findFirst({
      where: { idcajas: id, deleted_atcajas: null },
      select: SELECT_CAJA,
    });
    return row ? toEntity(row) : null;
  }

  async findCajaGeneralByPadre(cajaPadreId: number): Promise<CajaEntity | null> {
    const row = await this.prisma.caja.findFirst({
      where: {
        cajas_padres_idcajas_padres: cajaPadreId,
        tipocajas:                   'general',
        deleted_atcajas:             null,
        activocajas:                 true,
      },
      select: SELECT_CAJA,
    });
    return row ? toEntity(row) : null;
  }

  async findBySucursal(sucursalId: number): Promise<CajaEntity[]> {
    const rows = await this.prisma.caja.findMany({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas: null, activocajas: true },
      select: SELECT_CAJA,
      orderBy: { codigocajas: 'asc' },
    });
    return rows.map(toEntity);
  }

  async createCaja(data: CreateCajaData): Promise<CajaEntity> {
    const row = await this.prisma.caja.create({
      data: {
        sucursales_idsucursales:     data.sucursalId,
        cajas_padres_idcajas_padres: data.cajaPadreId,
        codigocajas:                 data.codigo,
        nombrecajas:                 data.nombre,
        tipocajas:                   data.tipo,
        base_diacajas:               data.baseDia ?? '0',
        limite_alertacajas:          data.limiteAlerta,
      },
      select: SELECT_CAJA,
    });
    return toEntity(row);
  }

  async updateCaja(id: number, data: UpdateCajaData): Promise<CajaEntity> {
    const row = await this.prisma.caja.update({
      where: { idcajas: id },
      data: {
        ...(data.cajaPadreId  !== undefined && { cajas_padres_idcajas_padres: data.cajaPadreId }),
        ...(data.codigo       !== undefined && { codigocajas:                 data.codigo }),
        ...(data.nombre       !== undefined && { nombrecajas:                 data.nombre }),
        ...(data.tipo         !== undefined && { tipocajas:                   data.tipo }),
        ...(data.baseDia      !== undefined && { base_diacajas:               data.baseDia }),
        ...(data.limiteAlerta !== undefined && { limite_alertacajas:          data.limiteAlerta }),
        ...(data.activo       !== undefined && { activocajas:                 data.activo }),
      },
      select: SELECT_CAJA,
    });
    return toEntity(row);
  }

  async deleteCaja(id: number): Promise<void> {
    await this.prisma.caja.update({
      where: { idcajas: id },
      data: { deleted_atcajas: new Date(), activocajas: false },
    });
  }

  async findAllPadres(): Promise<CajaPadreEntity[]> {
    const rows = await this.prisma.cajaPadre.findMany({
      where: { deleted_atcajas_padres: null },
      select: SELECT_PADRE,
      orderBy: { idcajas_padres: 'asc' },
    });
    return rows.map(toPadreEntity);
  }

  async findPadreById(id: number): Promise<CajaPadreEntity | null> {
    const row = await this.prisma.cajaPadre.findFirst({
      where: { idcajas_padres: id, deleted_atcajas_padres: null },
      select: SELECT_PADRE,
    });
    return row ? toPadreEntity(row) : null;
  }

  async findPadreBySucursal(sucursalId: number): Promise<CajaPadreEntity | null> {
    const row = await this.prisma.cajaPadre.findFirst({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas_padres: null },
      select: SELECT_PADRE,
    });
    return row ? toPadreEntity(row) : null;
  }

  async createPadre(data: CreateCajaPadreData): Promise<CajaPadreEntity> {
    const row = await this.prisma.cajaPadre.create({
      data: {
        sucursales_idsucursales:  data.sucursalId,
        nombrecajas_padres:       data.nombre,
        base_generalcajas_padres: data.baseGeneral ?? '0',
        hora_resetcajas_padres:   data.horaReset ? parseHoraReset(data.horaReset) : undefined,
      },
      select: SELECT_PADRE,
    });
    return toPadreEntity(row);
  }

  async updatePadre(id: number, data: UpdateCajaPadreData): Promise<CajaPadreEntity> {
    const row = await this.prisma.cajaPadre.update({
      where: { idcajas_padres: id },
      data: {
        ...(data.nombre      && { nombrecajas_padres:       data.nombre }),
        ...(data.baseGeneral && { base_generalcajas_padres: data.baseGeneral }),
        ...(data.horaReset   && { hora_resetcajas_padres:   parseHoraReset(data.horaReset) }),
      },
      select: SELECT_PADRE,
    });
    return toPadreEntity(row);
  }

  async deletePadre(id: number): Promise<void> {
    await this.prisma.cajaPadre.update({
      where: { idcajas_padres: id },
      data: { deleted_atcajas_padres: new Date() },
    });
  }

  async findPanelAdmin() {
    const rows = await this.prisma.sucursal.findMany({
      where:   { deleted_atsucursales: null },
      orderBy: { nombresucursales: 'asc' },
      select: {
        idsucursales:     true,
        codigosucursales: true,
        nombresucursales: true,
        tiposucursales:   true,
        regional: { select: { nombreregionales: true } },
        ciudad:   { select: { nombreciudades: true } },
        departamento: { select: { nombredepartamentos: true } },
        cajas: {
          where:  { tipocajas: 'pos', deleted_atcajas: null, activocajas: true },
          select: {
            idcajas:     true,
            codigocajas: true,
            nombrecajas: true,
            sesiones: {
              where:  { estadosesiones_caja: 'abierta' },
              select: { idsesiones_caja: true },
              take:   1,
            },
          },
          take: 1,
        },
        serviciosSucursal: {
          select: {
            activoservicios_sucursal: true,
            servicio: {
              select: {
                idservicios:     true,
                codigoservicios: true,
                nombreservicios: true,
                tiposervicios:   true,
                activoservicios: true,
              },
            },
          },
        },
      },
    });

    return rows.map(s => ({
      sucursalId:   s.idsucursales,
      codigo:       s.codigosucursales,
      nombre:       s.nombresucursales,
      tipo:         s.tiposucursales,
      regional:     s.regional.nombreregionales,
      ciudad:       s.ciudad?.nombreciudades ?? null,
      departamento: s.departamento?.nombredepartamentos ?? null,
      cajaPos: s.cajas[0] ? {
        id:           s.cajas[0].idcajas,
        codigo:       s.cajas[0].codigocajas,
        nombre:       s.cajas[0].nombrecajas,
        sesionActiva: s.cajas[0].sesiones.length > 0,
        sesionId:     s.cajas[0].sesiones[0]?.idsesiones_caja ?? null,
      } : null,
      servicios: s.serviciosSucursal.map(ss => ({
        id:     ss.servicio.idservicios,
        codigo: ss.servicio.codigoservicios,
        nombre: ss.servicio.nombreservicios,
        tipo:   ss.servicio.tiposervicios,
        activo: ss.activoservicios_sucursal,
      })),
    }));
  }

  async toggleServicioSucursal(sucursalId: number, servicioId: number, activo: boolean): Promise<void> {
    await this.prisma.servicioSucursal.upsert({
      where: {
        sucursales_idsucursales_servicios_idservicios: {
          sucursales_idsucursales: sucursalId,
          servicios_idservicios:   servicioId,
        },
      },
      update: { activoservicios_sucursal: activo },
      create: {
        sucursales_idsucursales: sucursalId,
        servicios_idservicios:   servicioId,
        activoservicios_sucursal: activo,
      },
    });
  }
}
