import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_REPOSITORY, type IClienteRepository } from '../domain/cliente.repository.js';
import { TIPO_CLIENTE_REPOSITORY, type ITipoClienteRepository } from '../domain/tipo-cliente.repository.js';
import {
  ClienteNoEncontradoError,
  ClienteYaExisteError,
  TipoClienteNoEncontradoError,
  TipoClienteCodigoDuplicadoError,
} from '../domain/cliente.errors.js';
import type { CreateClienteDto } from '../dto/create-cliente.dto.js';
import type { UpdateClienteDto } from '../dto/update-cliente.dto.js';
import type { SearchClienteDto } from '../dto/search-cliente.dto.js';
import type { CreateTipoClienteDto } from '../dto/create-tipo-cliente.dto.js';
import type { UpdateTipoClienteDto } from '../dto/update-tipo-cliente.dto.js';

@Injectable()
export class ClientesService {
  constructor(
    @Inject(CLIENTE_REPOSITORY)      private readonly clientesRepo:    IClienteRepository,
    @Inject(TIPO_CLIENTE_REPOSITORY) private readonly tiposRepo:       ITipoClienteRepository,
  ) {}

  // ── Tipos de cliente ────────────────────────────────────────────────────────

  async listTipos(soloActivos = false) {
    return this.tiposRepo.findAll(soloActivos);
  }

  async createTipo(dto: CreateTipoClienteDto) {
    const existing = await this.tiposRepo.findByCodigo(dto.codigo);
    if (existing) throw new TipoClienteCodigoDuplicadoError(dto.codigo);
    return this.tiposRepo.create({
      codigo:             dto.codigo,
      nombre:             dto.nombre,
      descuentoPorcentaje: dto.descuentoPorcentaje,
      aplicaEstampillas:  dto.aplicaEstampillas,
      aplicaGirosSisben:  dto.aplicaGirosSisben,
      vigenciaInicio:     dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null,
      vigenciaFin:        dto.vigenciaFin    ? new Date(dto.vigenciaFin)    : null,
    });
  }

  async updateTipo(id: number, dto: UpdateTipoClienteDto) {
    const existing = await this.tiposRepo.findById(id);
    if (!existing) throw new TipoClienteNoEncontradoError(id);
    return this.tiposRepo.update(id, {
      nombre:             dto.nombre,
      descuentoPorcentaje: dto.descuentoPorcentaje,
      aplicaEstampillas:  dto.aplicaEstampillas,
      aplicaGirosSisben:  dto.aplicaGirosSisben,
      activo:             dto.activo,
      vigenciaInicio:     dto.vigenciaInicio !== undefined ? (dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null) : undefined,
      vigenciaFin:        dto.vigenciaFin    !== undefined ? (dto.vigenciaFin    ? new Date(dto.vigenciaFin)    : null) : undefined,
    });
  }

  async deleteTipo(id: number) {
    const existing = await this.tiposRepo.findById(id);
    if (!existing) throw new TipoClienteNoEncontradoError(id);
    await this.tiposRepo.softDelete(id);
  }

  // ── Clientes ────────────────────────────────────────────────────────────────

  async buscarPorDocumento(tipoDocumento: string, numeroDocumento: string) {
    return this.clientesRepo.findByDocumento(tipoDocumento as any, numeroDocumento);
  }

  async search(dto: SearchClienteDto) {
    return this.clientesRepo.search({
      tipoDocumento:   dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      nombre:          dto.nombre,
      tipoClienteId:   dto.tipoClienteId,
      limit:           dto.limit,
      offset:          dto.offset,
    });
  }

  async getById(id: number) {
    const c = await this.clientesRepo.findById(id);
    if (!c) throw new ClienteNoEncontradoError(id);
    return c;
  }

  async create(dto: CreateClienteDto) {
    const existe = await this.clientesRepo.findByDocumento(dto.tipoDocumento, dto.numeroDocumento);
    if (existe) throw new ClienteYaExisteError(dto.tipoDocumento, dto.numeroDocumento);

    if (dto.tipoClienteId) {
      const tipo = await this.tiposRepo.findById(dto.tipoClienteId);
      if (!tipo) throw new TipoClienteNoEncontradoError(dto.tipoClienteId);
    }

    return this.clientesRepo.create({
      tipoDocumento:   dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      nombre:          dto.nombre,
      apellido:        dto.apellido,
      email:           dto.email,
      telefono:        dto.telefono,
      direccion:       dto.direccion,
      ciudad:          dto.ciudad,
      codigoPostal:    dto.codigoPostal,
      tipoClienteId:   dto.tipoClienteId ?? null,
      nivelSisben:     dto.nivelSisben   ?? null,
    });
  }

  async update(id: number, dto: UpdateClienteDto) {
    const c = await this.clientesRepo.findById(id);
    if (!c) throw new ClienteNoEncontradoError(id);

    if (dto.tipoClienteId) {
      const tipo = await this.tiposRepo.findById(dto.tipoClienteId);
      if (!tipo) throw new TipoClienteNoEncontradoError(dto.tipoClienteId);
    }

    return this.clientesRepo.update(id, {
      nombre:        dto.nombre,
      apellido:      dto.apellido,
      email:         dto.email,
      telefono:      dto.telefono,
      direccion:     dto.direccion,
      ciudad:        dto.ciudad,
      codigoPostal:  dto.codigoPostal,
      tipoClienteId: dto.tipoClienteId,
      nivelSisben:   dto.nivelSisben,
      activo:        dto.activo,
    });
  }
}
