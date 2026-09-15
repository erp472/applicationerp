import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IRegionalesRepository } from '../domain/regional.repository.js';
import type { RegionalEntity } from '../domain/regional.entity.js';
import type { QueryRegionalDto } from '../dto/query-regional.dto.js';
import type { SaldoSucursal } from '../domain/calculos/consolidado-regional.js';
import type { SucursalActividad } from '../domain/calculos/sucursales-activas.js';

const TIPOS_ENTRADA = new Set([
  'cambio_custodia_in', 'reposicion',
  'venta_producto', 'venta_servicio', 'venta_estampilla',
  'giro_emision_cobro', 'recaudo', 'diferencia_sobrante',
  'apartado_postal',
]);

const SELECT = {
  idregionales:          true,
  comercios_idcomercios: true,
  codigoregionales:      true,
  nombreregionales:      true,
  activoregionales:      true,
  created_atregionales:  true,
  comercio: {
    select: {
      idcomercios:     true,
      codigocomercios: true,
      nombrecomercios: true,
    },
  },
} satisfies Prisma.RegionalSelect;

type RegionalRow = Prisma.RegionalGetPayload<{ select: typeof SELECT }>;

function toEntity(row: RegionalRow): RegionalEntity {
  return {
    id:         row.idregionales,
    comercioId: row.comercios_idcomercios,
    codigo:     row.codigoregionales,
    nombre:     row.nombreregionales,
    activo:     row.activoregionales,
    createdAt:  row.created_atregionales,
    comercio: {
      id:     row.comercio.idcomercios,
      codigo: row.comercio.codigocomercios,
      nombre: row.comercio.nombrecomercios,
    },
  };
}

@Injectable()
export class PrismaRegionalesRepository implements IRegionalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { comercioId: number; codigo: string; nombre: string }): Promise<RegionalEntity> {
    const row = await this.prisma.regional.create({
      data: {
        comercios_idcomercios: data.comercioId,
        codigoregionales:      data.codigo,
        nombreregionales:      data.nombre,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QueryRegionalDto): Promise<{ datos: RegionalEntity[]; total: number }> {
    const { comercio_id, buscar, activo, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.RegionalWhereInput = {
      deleted_atregionales: null,
      ...(comercio_id !== undefined && { comercios_idcomercios: comercio_id }),
      ...(activo      !== undefined && { activoregionales: activo }),
      ...(buscar && {
        OR: [
          { nombreregionales:  { contains: buscar, mode: 'insensitive' } },
          { codigoregionales:  { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.regional.count({ where }),
      this.prisma.regional.findMany({
        where, select: SELECT, orderBy: { nombreregionales: 'asc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<RegionalEntity | null> {
    const row = await this.prisma.regional.findFirst({
      where: { idregionales: id, deleted_atregionales: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByCodigo(codigo: string): Promise<RegionalEntity | null> {
    const row = await this.prisma.regional.findFirst({
      where: { codigoregionales: codigo, deleted_atregionales: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async comercioExists(comercioId: number): Promise<boolean> {
    const count = await this.prisma.comercio.count({
      where: { idcomercios: comercioId, deleted_atcomercios: null },
    });
    return count > 0;
  }

  async countActiveSucursales(regionalId: number): Promise<number> {
    return this.prisma.sucursal.count({
      where: { regionales_idregionales: regionalId, deleted_atsucursales: null, activosucursales: true },
    });
  }

  async getSucursalesConActividad(regionalId: number): Promise<SucursalActividad[]> {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const sucursales = await this.prisma.sucursal.findMany({
      where: { regionales_idregionales: regionalId, deleted_atsucursales: null },
      select: {
        idsucursales: true,
        cajas: {
          select: {
            sesiones: {
              where: {
                estadosesiones_caja: 'abierta',
                fecha_aperturasesiones_caja: { gte: hoyInicio },
              },
              select: { idsesiones_caja: true },
              take: 1,
            },
          },
        },
      },
    });

    return sucursales.map(s => ({
      sucursalId: s.idsucursales,
      tieneSesionAbiertaHoy: s.cajas.some(c => c.sesiones.length > 0),
    }));
  }

  async getSaldosPorSucursal(regionalId: number): Promise<SaldoSucursal[]> {
    const sucursales = await this.prisma.sucursal.findMany({
      where: { regionales_idregionales: regionalId, deleted_atsucursales: null },
      select: {
        idsucursales: true,
        cajas: {
          select: {
            sesiones: {
              where: { estadosesiones_caja: 'abierta' },
              select: {
                movimientosCaja: {
                  select: {
                    tipomovimientos_caja: true,
                    montomovimientos_caja: true,
                    medio_pagomovimientos_caja: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return sucursales.map(s => {
      const acc = { efectivo: 0, tarjetaDebito: 0, tarjetaCredito: 0, transferencia: 0, consignacion: 0, preporteado: 0, mixtoPreporteado: 0 };

      for (const caja of s.cajas) {
        for (const sesion of caja.sesiones) {
          for (const mov of sesion.movimientosCaja) {
            if (!mov.medio_pagomovimientos_caja) continue;
            const sign = TIPOS_ENTRADA.has(mov.tipomovimientos_caja) ? 1 : -1;
            const monto = Number(mov.montomovimientos_caja) * sign;
            switch (mov.medio_pagomovimientos_caja) {
              case 'efectivo':       acc.efectivo       += monto; break;
              case 'tarjeta_debito': acc.tarjetaDebito  += monto; break;
              case 'tarjeta_credito':acc.tarjetaCredito += monto; break;
              case 'transferencia':  acc.transferencia  += monto; break;
              case 'consignacion':   acc.consignacion   += monto; break;
              case 'preporteado':    acc.preporteado    += monto; break;
              case 'mixto_preporteado': acc.mixtoPreporteado += monto; break;
            }
          }
        }
      }

      return {
        sucursalId:      s.idsucursales,
        efectivo:        String(Math.max(0, acc.efectivo)),
        tarjetaDebito:   String(Math.max(0, acc.tarjetaDebito)),
        tarjetaCredito:  String(Math.max(0, acc.tarjetaCredito)),
        transferencia:   String(Math.max(0, acc.transferencia)),
        consignacion:    String(Math.max(0, acc.consignacion)),
        preporteado:     String(Math.max(0, acc.preporteado)),
        mixtoPreporteado:String(Math.max(0, acc.mixtoPreporteado)),
      };
    });
  }

  async update(id: number, data: { nombre?: string; activo?: boolean }): Promise<RegionalEntity> {
    const row = await this.prisma.regional.update({
      where: { idregionales: id },
      data: {
        ...(data.nombre !== undefined && { nombreregionales: data.nombre }),
        ...(data.activo !== undefined && { activoregionales: data.activo }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<RegionalEntity> {
    const row = await this.prisma.regional.update({
      where: { idregionales: id },
      data:  { activoregionales: false, deleted_atregionales: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }
}
