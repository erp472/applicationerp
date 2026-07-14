import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ICajasRepository } from '../domain/caja.repository.js';
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
    id:           row.idcajas_padres,
    sucursalId:   row.sucursales_idsucursales,
    nombre:       row.nombrecajas_padres,
    baseGeneral:  row.base_generalcajas_padres.toString(),
    horaReset:    row.hora_resetcajas_padres,
  };
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

  async findBySucursal(sucursalId: number): Promise<CajaEntity[]> {
    const rows = await this.prisma.caja.findMany({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas: null, activocajas: true },
      select: SELECT_CAJA,
      orderBy: { codigocajas: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findPadreBySucursal(sucursalId: number): Promise<CajaPadreEntity | null> {
    const row = await this.prisma.cajaPadre.findFirst({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas_padres: null },
      select: SELECT_PADRE,
    });
    return row ? toPadreEntity(row) : null;
  }
}
