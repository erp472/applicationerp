import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ISacasRepository, CreateSacaData } from '../domain/saca.repository.js';
import type { SacaEntity } from '../domain/saca.entity.js';

function toEntity(row: any): SacaEntity {
  return {
    id:                  row.idsacas,
    numeroPrecinto:      row.numero_precintosacas,
    sucursalId:          row.sucursales_idsucursales,
    sesionCajaId:        row.sesiones_caja_idsesiones_caja,
    usuarioId:           row.usuarios_idusuarios,
    tipo:                row.tiposacas,
    tipoConsolidacion:   row.tipo_sacasacas,
    centroOperativoDest: row.centro_operativo_destinosacas,
    estado:              row.estadosacas,
    pesoKg:              row.peso_kgsacas ? Number(row.peso_kgsacas) : null,
    totalEnvios:         row.total_enviossacas,
    transportistaNombre: row.transportista_nombresacas,
    transportistaFirma:  row.transportista_firmasacas,
    fechaDespacho:       row.fecha_despachosacas,
    createdAt:           row.created_atsacas,
    cerradaAt:           row.cerrada_atsacas,
  };
}

@Injectable()
export class PrismaSacasRepository implements ISacasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSacaData): Promise<SacaEntity> {
    const row = await this.prisma.saca.create({
      data: {
        numero_precintosacas:          data.numeroPrecinto,
        sucursales_idsucursales:       data.sucursalId,
        sesiones_caja_idsesiones_caja: data.sesionCajaId ?? null,
        usuarios_idusuarios:           data.usuarioId,
        tiposacas:                     data.tipo as any,
        tipo_sacasacas:                (data.tipoConsolidacion ?? 'consolidada') as any,
        centro_operativo_destinosacas: data.centroOperativoDest ?? null,
        transportista_nombresacas:     data.transportistaNombre ?? null,
      },
    });
    return toEntity(row);
  }

  async findById(id: number): Promise<SacaEntity | null> {
    const row = await this.prisma.saca.findUnique({ where: { idsacas: id } });
    return row ? toEntity(row) : null;
  }

  async findBySucursal(sucursalId: number, estado?: string): Promise<SacaEntity[]> {
    const rows = await this.prisma.saca.findMany({
      where: {
        sucursales_idsucursales: sucursalId,
        ...(estado ? { estadosacas: estado as any } : {}),
      },
      orderBy: { created_atsacas: 'desc' },
    });
    return rows.map(toEntity);
  }

  async addEnvio(sacaId: number, envioId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.envioSaca.create({
        data: { sacas_idsacas: sacaId, envios_idenvios: envioId },
      }),
      this.prisma.saca.update({
        where: { idsacas: sacaId },
        data:  { total_enviossacas: { increment: 1 } },
      }),
    ]);
  }

  async envioEnSaca(envioId: number): Promise<boolean> {
    const existing = await this.prisma.envioSaca.findFirst({
      where: { envios_idenvios: envioId },
    });
    return !!existing;
  }

  async cerrar(id: number, pesoKg?: number, transportistaNombre?: string, fechaDespacho?: Date): Promise<SacaEntity> {
    const row = await this.prisma.saca.update({
      where: { idsacas: id },
      data: {
        estadosacas:                  'cerrada',
        cerrada_atsacas:              new Date(),
        ...(pesoKg !== undefined      ? { peso_kgsacas: pesoKg }                     : {}),
        ...(transportistaNombre       ? { transportista_nombresacas: transportistaNombre } : {}),
        ...(fechaDespacho             ? { fecha_despachosacas: fechaDespacho }         : {}),
        ...(transportistaNombre       ? { transportista_firmasacas: true }             : {}),
      },
    });
    return toEntity(row);
  }
}
