import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ITipoClienteRepository, CreateTipoClienteData, UpdateTipoClienteData } from '../domain/tipo-cliente.repository.js';
import type { TipoClienteEntity } from '../domain/cliente.entity.js';

@Injectable()
export class PrismaTipoClienteRepository implements ITipoClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(r: any): TipoClienteEntity {
    return {
      id:                  r.idtipos_cliente,
      codigo:              r.codigotipos_cliente,
      nombre:              r.nombretipos_cliente,
      descuentoPorcentaje: r.descuento_porcentajetipos_cliente.toString(),
      aplicaEstampillas:   r.aplica_estampillastipos_cliente,
      aplicaGirosSisben:   r.aplica_giros_sisbentipos_cliente,
      activo:              r.activotipos_cliente,
      vigenciaInicio:      r.vigencia_iniciotipos_cliente,
      vigenciaFin:         r.vigencia_fintipos_cliente,
      createdAt:           r.created_attipos_cliente,
    };
  }

  async findAll(soloActivos = false): Promise<TipoClienteEntity[]> {
    const rows = await this.prisma.tipoCliente.findMany({
      where: {
        deleted_attipos_cliente: null,
        ...(soloActivos && { activotipos_cliente: true }),
      },
      orderBy: { nombretipos_cliente: 'asc' },
    });
    return rows.map(r => this.map(r));
  }

  async findById(id: number): Promise<TipoClienteEntity | null> {
    const r = await this.prisma.tipoCliente.findUnique({ where: { idtipos_cliente: id } });
    return r ? this.map(r) : null;
  }

  async findByCodigo(codigo: string): Promise<TipoClienteEntity | null> {
    const r = await this.prisma.tipoCliente.findUnique({ where: { codigotipos_cliente: codigo } });
    return r ? this.map(r) : null;
  }

  async create(data: CreateTipoClienteData): Promise<TipoClienteEntity> {
    const r = await this.prisma.tipoCliente.create({
      data: {
        codigotipos_cliente:              data.codigo,
        nombretipos_cliente:              data.nombre,
        descuento_porcentajetipos_cliente: data.descuentoPorcentaje ?? '0',
        aplica_estampillastipos_cliente:  data.aplicaEstampillas ?? false,
        aplica_giros_sisbentipos_cliente: data.aplicaGirosSisben ?? false,
        vigencia_iniciotipos_cliente:     data.vigenciaInicio ?? null,
        vigencia_fintipos_cliente:        data.vigenciaFin ?? null,
      },
    });
    return this.map(r);
  }

  async update(id: number, data: UpdateTipoClienteData): Promise<TipoClienteEntity> {
    const r = await this.prisma.tipoCliente.update({
      where: { idtipos_cliente: id },
      data: {
        ...(data.nombre             !== undefined && { nombretipos_cliente:              data.nombre }),
        ...(data.descuentoPorcentaje !== undefined && { descuento_porcentajetipos_cliente: data.descuentoPorcentaje }),
        ...(data.aplicaEstampillas  !== undefined && { aplica_estampillastipos_cliente:  data.aplicaEstampillas }),
        ...(data.aplicaGirosSisben  !== undefined && { aplica_giros_sisbentipos_cliente: data.aplicaGirosSisben }),
        ...(data.activo             !== undefined && { activotipos_cliente:              data.activo }),
        ...(data.vigenciaInicio     !== undefined && { vigencia_iniciotipos_cliente:     data.vigenciaInicio }),
        ...(data.vigenciaFin        !== undefined && { vigencia_fintipos_cliente:        data.vigenciaFin }),
      },
    });
    return this.map(r);
  }

  async softDelete(id: number): Promise<void> {
    await this.prisma.tipoCliente.update({
      where: { idtipos_cliente: id },
      data:  { deleted_attipos_cliente: new Date(), activotipos_cliente: false },
    });
  }
}
