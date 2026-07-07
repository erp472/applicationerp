import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ISucursalesRepository } from '../domain/sucursal.repository.js';
import type { SucursalEntity } from '../domain/sucursal.entity.js';
import type { QuerySucursalDto } from '../dto/query-sucursal.dto.js';

const SELECT = {
  idsucursales:                  true,
  regionales_idregionales:       true,
  paises_idpaises:               true,
  departamentos_iddepartamentos: true,
  ciudades_idciudades:           true,
  codigosucursales:              true,
  nombresucursales:              true,
  direccionsucursales:           true,
  tiposucursales:                true,
  telefonosucursales:            true,
  emailsucursales:               true,
  horario_aperturasucursales:    true,
  horario_cierresucursales:      true,
  activosucursales:              true,
  created_atsucursales:          true,
  updated_atsucursales:          true,
  regional: {
    select: {
      idregionales:     true,
      codigoregionales: true,
      nombreregionales: true,
      comercio: {
        select: { idcomercios: true, codigocomercios: true, nombrecomercios: true },
      },
    },
  },
  pais:         { select: { idpaises: true, nombrepaises: true } },
  departamento: { select: { iddepartamentos: true, nombredepartamentos: true } },
  ciudad:       { select: { idciudades: true, nombreciudades: true } },
} satisfies Prisma.SucursalSelect;

type SucursalRow = Prisma.SucursalGetPayload<{ select: typeof SELECT }>;

function toEntity(row: SucursalRow): SucursalEntity {
  return {
    id:             row.idsucursales,
    regionalId:     row.regionales_idregionales,
    paisId:         row.paises_idpaises ?? null,
    departamentoId: row.departamentos_iddepartamentos ?? null,
    ciudadId:       row.ciudades_idciudades ?? null,
    codigo:         row.codigosucursales,
    nombre:         row.nombresucursales,
    direccion:      row.direccionsucursales ?? null,
    tipo:           row.tiposucursales,
    telefono:       row.telefonosucursales ?? null,
    email:          row.emailsucursales ?? null,
    horarioApertura: row.horario_aperturasucursales ?? null,
    horarioCierre:  row.horario_cierresucursales ?? null,
    activo:         row.activosucursales,
    createdAt:      row.created_atsucursales,
    updatedAt:      row.updated_atsucursales,
    regional: {
      id:     row.regional.idregionales,
      codigo: row.regional.codigoregionales,
      nombre: row.regional.nombreregionales,
      comercio: {
        id:     row.regional.comercio.idcomercios,
        codigo: row.regional.comercio.codigocomercios,
        nombre: row.regional.comercio.nombrecomercios,
      },
    },
    pais:         row.pais         ? { id: row.pais.idpaises,             nombre: row.pais.nombrepaises             } : null,
    departamento: row.departamento ? { id: row.departamento.iddepartamentos, nombre: row.departamento.nombredepartamentos } : null,
    ciudad:       row.ciudad       ? { id: row.ciudad.idciudades,           nombre: row.ciudad.nombreciudades           } : null,
  };
}

@Injectable()
export class PrismaSucursalesRepository implements ISucursalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Parameters<ISucursalesRepository['create']>[0]): Promise<SucursalEntity> {
    const row = await this.prisma.sucursal.create({
      data: {
        regionales_idregionales:       data.regionalId,
        codigosucursales:              data.codigo,
        nombresucursales:              data.nombre,
        tiposucursales:                data.tipo as 'unipersonal' | 'multipuesto',
        direccionsucursales:           data.direccion ?? null,
        telefonosucursales:            data.telefono ?? null,
        emailsucursales:               data.email ?? null,
        horario_aperturasucursales:    data.horarioApertura ?? null,
        horario_cierresucursales:      data.horarioCierre ?? null,
        paises_idpaises:               data.paisId ?? null,
        departamentos_iddepartamentos: data.departamentoId ?? null,
        ciudades_idciudades:           data.ciudadId ?? null,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QuerySucursalDto): Promise<{ datos: SucursalEntity[]; total: number }> {
    const { regional_id, ciudad_id, tipo, activo, buscar, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.SucursalWhereInput = {
      deleted_atsucursales: null,
      ...(regional_id !== undefined && { regionales_idregionales: regional_id }),
      ...(ciudad_id   !== undefined && { ciudades_idciudades: ciudad_id }),
      ...(tipo        !== undefined && { tiposucursales: tipo }),
      ...(activo      !== undefined && { activosucursales: activo }),
      ...(buscar && {
        OR: [
          { nombresucursales:  { contains: buscar, mode: 'insensitive' } },
          { codigosucursales:  { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.sucursal.count({ where }),
      this.prisma.sucursal.findMany({
        where, select: SELECT, orderBy: { nombresucursales: 'asc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<SucursalEntity | null> {
    const row = await this.prisma.sucursal.findFirst({
      where: { idsucursales: id, deleted_atsucursales: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async findByCodigo(codigo: string): Promise<SucursalEntity | null> {
    const row = await this.prisma.sucursal.findFirst({
      where: { codigosucursales: codigo, deleted_atsucursales: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async regionalExists(regionalId: number): Promise<boolean> {
    const count = await this.prisma.regional.count({
      where: { idregionales: regionalId, deleted_atregionales: null },
    });
    return count > 0;
  }

  async ciudadDepartamentoId(ciudadId: number): Promise<number | null> {
    const row = await this.prisma.ciudad.findUnique({
      where:  { idciudades: ciudadId },
      select: { departamentos_iddepartamentos: true },
    });
    return row?.departamentos_iddepartamentos ?? null;
  }

  async countActiveUsers(sucursalId: number): Promise<number> {
    return this.prisma.usuario.count({
      where: { sucursales_idsucursales: sucursalId, deleted_atusuarios: null, activousuarios: true },
    });
  }

  async update(id: number, data: Parameters<ISucursalesRepository['update']>[1]): Promise<SucursalEntity> {
    const row = await this.prisma.sucursal.update({
      where: { idsucursales: id },
      data: {
        ...(data.nombre          !== undefined && { nombresucursales:              data.nombre }),
        ...(data.tipo            !== undefined && { tiposucursales:                data.tipo as 'unipersonal' | 'multipuesto' }),
        ...(data.direccion       !== undefined && { direccionsucursales:           data.direccion }),
        ...(data.telefono        !== undefined && { telefonosucursales:            data.telefono }),
        ...(data.email           !== undefined && { emailsucursales:               data.email }),
        ...(data.horarioApertura !== undefined && { horario_aperturasucursales:    data.horarioApertura }),
        ...(data.horarioCierre   !== undefined && { horario_cierresucursales:      data.horarioCierre }),
        ...(data.paisId          !== undefined && { paises_idpaises:               data.paisId }),
        ...(data.departamentoId  !== undefined && { departamentos_iddepartamentos: data.departamentoId }),
        ...(data.ciudadId        !== undefined && { ciudades_idciudades:           data.ciudadId }),
        ...(data.activo          !== undefined && { activosucursales:              data.activo }),
        updated_atsucursales: new Date(),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<SucursalEntity> {
    const row = await this.prisma.sucursal.update({
      where: { idsucursales: id },
      data:  { activosucursales: false, deleted_atsucursales: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }
}
