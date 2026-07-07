import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IEquiposRepository } from '../domain/equipo.repository.js';
import type { EquipoEntity } from '../domain/equipo.entity.js';
import type { QueryEquipoDto } from '../dto/query-equipo.dto.js';

const SELECT = {
  idequipos_autorizados:                true,
  sucursales_idsucursales:              true,
  mac_addressequipos_autorizados:       true,
  nombreequipos_autorizados:            true,
  sistema_operativoequipos_autorizados: true,
  activoequipos_autorizados:            true,
  created_atequipos_autorizados:        true,
  sucursal: {
    select: {
      idsucursales:     true,
      codigosucursales: true,
      nombresucursales: true,
    },
  },
} satisfies Prisma.EquipoAutorizadoSelect;

type EquipoRow = Prisma.EquipoAutorizadoGetPayload<{ select: typeof SELECT }>;

function toEntity(row: EquipoRow): EquipoEntity {
  return {
    id:               row.idequipos_autorizados,
    sucursalId:       row.sucursales_idsucursales,
    mac:              row.mac_addressequipos_autorizados,
    nombre:           row.nombreequipos_autorizados ?? null,
    sistemaOperativo: row.sistema_operativoequipos_autorizados ?? null,
    activo:           row.activoequipos_autorizados,
    createdAt:        row.created_atequipos_autorizados,
    sucursal: {
      id:     row.sucursal.idsucursales,
      codigo: row.sucursal.codigosucursales,
      nombre: row.sucursal.nombresucursales,
    },
  };
}

@Injectable()
export class PrismaEquiposRepository implements IEquiposRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Parameters<IEquiposRepository['create']>[0]): Promise<EquipoEntity> {
    const row = await this.prisma.equipoAutorizado.create({
      data: {
        sucursales_idsucursales:              data.sucursalId,
        mac_addressequipos_autorizados:       data.mac,
        nombreequipos_autorizados:            data.nombre ?? null,
        sistema_operativoequipos_autorizados: (data.sistemaOperativo ?? null) as 'windows' | 'linux' | 'macos' | null,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QueryEquipoDto): Promise<{ datos: EquipoEntity[]; total: number }> {
    const { sucursal_id, sistema_operativo, activo, buscar, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.EquipoAutorizadoWhereInput = {
      deleted_atequipos_autorizados: null,
      ...(sucursal_id       !== undefined && { sucursales_idsucursales: sucursal_id }),
      ...(sistema_operativo !== undefined && { sistema_operativoequipos_autorizados: sistema_operativo }),
      ...(activo            !== undefined && { activoequipos_autorizados: activo }),
      ...(buscar && {
        OR: [
          { mac_addressequipos_autorizados: { contains: buscar, mode: 'insensitive' } },
          { nombreequipos_autorizados:      { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.equipoAutorizado.count({ where }),
      this.prisma.equipoAutorizado.findMany({
        where, select: SELECT, orderBy: { created_atequipos_autorizados: 'desc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<EquipoEntity | null> {
    const row = await this.prisma.equipoAutorizado.findFirst({
      where: { idequipos_autorizados: id, deleted_atequipos_autorizados: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByMac(mac: string): Promise<EquipoEntity | null> {
    const row = await this.prisma.equipoAutorizado.findFirst({
      where: { mac_addressequipos_autorizados: mac, deleted_atequipos_autorizados: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  // MAC es único globalmente incluyendo soft-deleted — no se reutilizan (#POC-AUTH-001)
  async macExists(mac: string): Promise<boolean> {
    const count = await this.prisma.equipoAutorizado.count({
      where: { mac_addressequipos_autorizados: mac },
    });
    return count > 0;
  }

  async sucursalExists(sucursalId: number): Promise<boolean> {
    const count = await this.prisma.sucursal.count({
      where: { idsucursales: sucursalId, deleted_atsucursales: null },
    });
    return count > 0;
  }

  async update(id: number, data: Parameters<IEquiposRepository['update']>[1]): Promise<EquipoEntity> {
    const row = await this.prisma.equipoAutorizado.update({
      where: { idequipos_autorizados: id },
      data: {
        ...(data.nombre           !== undefined && { nombreequipos_autorizados:            data.nombre }),
        ...(data.sistemaOperativo !== undefined && { sistema_operativoequipos_autorizados: data.sistemaOperativo as 'windows' | 'linux' | 'macos' | null }),
        ...(data.activo           !== undefined && { activoequipos_autorizados:            data.activo }),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<EquipoEntity> {
    const row = await this.prisma.equipoAutorizado.update({
      where: { idequipos_autorizados: id },
      data:  { activoequipos_autorizados: false, deleted_atequipos_autorizados: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }
}
