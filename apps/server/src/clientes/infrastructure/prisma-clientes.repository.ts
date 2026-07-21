import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IClienteRepository, CreateClienteData, UpdateClienteData, SearchClienteParams } from '../domain/cliente.repository.js';
import type { ClienteEntity } from '../domain/cliente.entity.js';

@Injectable()
export class PrismaClientesRepository implements IClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(r: any): ClienteEntity {
    return {
      id:              r.idclientes,
      tipoDocumento:   r.tipo_documentoclientes,
      numeroDocumento: r.numero_documentoclientes,
      nombre:          r.nombreclientes,
      apellido:        r.apellidoclientes,
      email:           r.emailclientes,
      telefono:        r.telefonoclientes,
      direccion:       r.direccionclientes,
      ciudad:          r.ciudadclientes,
      codigoPostal:    r.codigo_postalclientes,
      tipoClienteId:   r.tipos_cliente_idtipos_cliente,
      nivelSisben:     r.nivel_sisbenclientes,
      enviosSisbenAno: r.envios_sisben_anoclientes,
      activo:          r.activoclientes,
      createdAt:       r.created_atclientes,
      updatedAt:       r.updated_atclientes,
      tipoCliente: r.tipoCliente
        ? {
            id:                  r.tipoCliente.idtipos_cliente,
            codigo:              r.tipoCliente.codigotipos_cliente,
            nombre:              r.tipoCliente.nombretipos_cliente,
            descuentoPorcentaje: r.tipoCliente.descuento_porcentajetipos_cliente.toString(),
            aplicaEstampillas:   r.tipoCliente.aplica_estampillastipos_cliente,
            aplicaGirosSisben:   r.tipoCliente.aplica_giros_sisbentipos_cliente,
            activo:              r.tipoCliente.activotipos_cliente,
            vigenciaInicio:      r.tipoCliente.vigencia_iniciotipos_cliente,
            vigenciaFin:         r.tipoCliente.vigencia_fintipos_cliente,
            createdAt:           r.tipoCliente.created_attipos_cliente,
          }
        : undefined,
    };
  }

  async findById(id: number): Promise<ClienteEntity | null> {
    const r = await this.prisma.cliente.findUnique({
      where: { idclientes: id },
      include: { tipoCliente: true },
    });
    return r ? this.map(r) : null;
  }

  async findByDocumento(tipo: string, numero: string): Promise<ClienteEntity | null> {
    const r = await this.prisma.cliente.findUnique({
      where: { tipo_documentoclientes_numero_documentoclientes: { tipo_documentoclientes: tipo as any, numero_documentoclientes: numero } },
      include: { tipoCliente: true },
    });
    return r ? this.map(r) : null;
  }

  async search(params: SearchClienteParams): Promise<{ items: ClienteEntity[]; total: number }> {
    const where: any = { deleted_atclientes: null };
    if (params.tipoDocumento)   where.tipo_documentoclientes    = params.tipoDocumento;
    if (params.numeroDocumento) where.numero_documentoclientes  = { contains: params.numeroDocumento };
    if (params.nombre)          where.OR = [
      { nombreclientes:   { contains: params.nombre, mode: 'insensitive' } },
      { apellidoclientes: { contains: params.nombre, mode: 'insensitive' } },
    ];
    if (params.tipoClienteId != null) where.tipos_cliente_idtipos_cliente = params.tipoClienteId;

    const [total, items] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        include: { tipoCliente: true },
        orderBy: { nombreclientes: 'asc' },
        take:  params.limit  ?? 20,
        skip:  params.offset ?? 0,
      }),
    ]);
    return { total, items: items.map(r => this.map(r)) };
  }

  async create(data: CreateClienteData): Promise<ClienteEntity> {
    const r = await this.prisma.cliente.create({
      data: {
        tipo_documentoclientes:      data.tipoDocumento as any,
        numero_documentoclientes:    data.numeroDocumento,
        nombreclientes:              data.nombre,
        apellidoclientes:            data.apellido,
        emailclientes:               data.email,
        telefonoclientes:            data.telefono,
        direccionclientes:           data.direccion,
        ciudadclientes:              data.ciudad,
        codigo_postalclientes:       data.codigoPostal,
        tipos_cliente_idtipos_cliente: data.tipoClienteId ?? null,
        nivel_sisbenclientes:        data.nivelSisben ?? null,
      },
      include: { tipoCliente: true },
    });
    return this.map(r);
  }

  async update(id: number, data: UpdateClienteData): Promise<ClienteEntity> {
    const r = await this.prisma.cliente.update({
      where: { idclientes: id },
      data: {
        ...(data.nombre        !== undefined && { nombreclientes:              data.nombre }),
        ...(data.apellido      !== undefined && { apellidoclientes:            data.apellido }),
        ...(data.email         !== undefined && { emailclientes:               data.email }),
        ...(data.telefono      !== undefined && { telefonoclientes:            data.telefono }),
        ...(data.direccion     !== undefined && { direccionclientes:           data.direccion }),
        ...(data.ciudad        !== undefined && { ciudadclientes:              data.ciudad }),
        ...(data.codigoPostal  !== undefined && { codigo_postalclientes:       data.codigoPostal }),
        ...(data.tipoClienteId !== undefined && { tipos_cliente_idtipos_cliente: data.tipoClienteId }),
        ...(data.nivelSisben   !== undefined && { nivel_sisbenclientes:        data.nivelSisben }),
        ...(data.activo        !== undefined && { activoclientes:              data.activo }),
        updated_atclientes: new Date(),
      },
      include: { tipoCliente: true },
    });
    return this.map(r);
  }
}
