import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IRecaudosRepository, RegistrarRecaudoData } from '../domain/recaudo.repository.js';
import type { ConvenioEntity, RecaudoEntity } from '../domain/recaudo.entity.js';

function toConvenio(row: { idconvenios_recaudo: number; codigoconvenios_recaudo: string; nombreconvenios_recaudo: string; descripcionconvenios_recaudo: string | null; activoconvenios_recaudo: boolean }): ConvenioEntity {
  return {
    id:          row.idconvenios_recaudo,
    codigo:      row.codigoconvenios_recaudo,
    nombre:      row.nombreconvenios_recaudo,
    descripcion: row.descripcionconvenios_recaudo,
    activo:      row.activoconvenios_recaudo,
  };
}

function toRecaudo(row: { idrecaudos: number; convenios_recaudo_idconvenios_recaudo: number; sucursales_idsucursales: number; sesiones_caja_idsesiones_caja: number | null; usuarios_idusuarios: number; clientes_idclientes: number | null; referencia_pagorecaudos: string; codigo_barrasrecaudos: string | null; montorecaudos: { toNumber(): number }; estadorecaudos: string; created_atrecaudos: Date }): RecaudoEntity {
  return {
    id:             row.idrecaudos,
    convenioId:     row.convenios_recaudo_idconvenios_recaudo,
    sucursalId:     row.sucursales_idsucursales,
    sesionCajaId:   row.sesiones_caja_idsesiones_caja,
    usuarioId:      row.usuarios_idusuarios,
    clienteId:      row.clientes_idclientes,
    referenciaPago: row.referencia_pagorecaudos,
    codigoBarras:   row.codigo_barrasrecaudos,
    monto:          row.montorecaudos.toNumber(),
    estado:         row.estadorecaudos as import('../domain/recaudo.entity.js').EstadoRecaudo,
    createdAt:      row.created_atrecaudos,
  };
}

@Injectable()
export class PrismaRecaudosRepository implements IRecaudosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findConveniosBySucursal(sucursalId: number): Promise<ConvenioEntity[]> {
    const rows = await this.prisma.convenioRecaudo.findMany({
      where: {
        activoconvenios_recaudo:    true,
        deleted_atconvenios_recaudo: null,
        conveniosSucursal: {
          some: { sucursales_idsucursales: sucursalId, activoconvenios_sucursal: true },
        },
      },
    });
    return rows.map(toConvenio);
  }

  async findConvenioById(id: number): Promise<ConvenioEntity | null> {
    const row = await this.prisma.convenioRecaudo.findFirst({
      where: { idconvenios_recaudo: id, deleted_atconvenios_recaudo: null },
    });
    return row ? toConvenio(row) : null;
  }

  async isConvenioActivoEnSucursal(convenioId: number, sucursalId: number): Promise<boolean> {
    const link = await this.prisma.convenioSucursal.findFirst({
      where: {
        convenios_recaudo_idconvenios_recaudo: convenioId,
        sucursales_idsucursales:               sucursalId,
        activoconvenios_sucursal:              true,
      },
    });
    return link !== null;
  }

  async registrarRecaudo(data: RegistrarRecaudoData): Promise<RecaudoEntity> {
    const row = await this.prisma.recaudo.create({
      data: {
        convenios_recaudo_idconvenios_recaudo: data.convenioId,
        sucursales_idsucursales:               data.sucursalId,
        sesiones_caja_idsesiones_caja:         data.sesionCajaId,
        usuarios_idusuarios:                   data.usuarioId,
        clientes_idclientes:                   data.clienteId ?? null,
        referencia_pagorecaudos:               data.referenciaPago,
        codigo_barrasrecaudos:                 data.codigoBarras ?? null,
        montorecaudos:                         data.monto,
        estadorecaudos:                        'exitoso',
      },
    });
    return toRecaudo(row);
  }

  async anularRecaudo(id: number): Promise<RecaudoEntity> {
    const row = await this.prisma.recaudo.update({
      where: { idrecaudos: id },
      data:  { estadorecaudos: 'anulado' },
    });
    return toRecaudo(row);
  }

  async findRecaudoById(id: number): Promise<RecaudoEntity | null> {
    const row = await this.prisma.recaudo.findFirst({ where: { idrecaudos: id } });
    return row ? toRecaudo(row) : null;
  }

  async findRecaudosBySesion(sesionId: number): Promise<RecaudoEntity[]> {
    const rows = await this.prisma.recaudo.findMany({
      where:   { sesiones_caja_idsesiones_caja: sesionId },
      orderBy: { created_atrecaudos: 'asc' },
    });
    return rows.map(toRecaudo);
  }
}
