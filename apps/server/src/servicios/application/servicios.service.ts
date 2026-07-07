import { Inject, Injectable } from '@nestjs/common';
import type { IServiciosRepository } from '../domain/servicio.repository.js';
import { SERVICIOS_REPOSITORY } from '../domain/servicio.repository.js';
import type { CreateServicioDto } from '../dto/create-servicio.dto.js';
import type { UpdateServicioDto } from '../dto/update-servicio.dto.js';
import type { QueryServicioDto } from '../dto/query-servicio.dto.js';
import {
  validateCodigoNotDuplicated,
  validateRequiereDimensiones,
  validateCamposPositivos,
  validateEstampillaConsistency,
} from '../domain/business-rules.js';
import {
  ServicioNotFoundError,
  ServicioSucursalNoEncontradaError,
  ServicioYaAsignadoError,
  ServicioNoAsignadoError,
} from '../domain/servicio.errors.js';

@Injectable()
export class ServiciosService {
  constructor(
    @Inject(SERVICIOS_REPOSITORY) private readonly repo: IServiciosRepository,
  ) {}

  async create(dto: CreateServicioDto) {
    validateEstampillaConsistency(dto.requiere_estampilla, dto.tipo);
    validateCamposPositivos(dto.tiempo_entrega_dias ?? null, dto.peso_maximo_kg ?? null);
    validateRequiereDimensiones(dto.requiere_dimensiones, dto.factor_volumetrico ?? null);

    const codigoExists = await this.repo.codigoExists(dto.codigo);
    validateCodigoNotDuplicated(dto.codigo, codigoExists);

    return this.repo.create({
      codigo:                  dto.codigo,
      nombre:                  dto.nombre,
      descripcion:             dto.descripcion ?? null,
      tipo:                    dto.tipo,
      requiereEstampilla:      dto.requiere_estampilla,
      requiereDimensiones:     dto.requiere_dimensiones,
      requiereValorDeclarado:  dto.requiere_valor_declarado,
      pesoMaximoKg:            dto.peso_maximo_kg ?? null,
      factorVolumetrico:       dto.factor_volumetrico,
      tiempoEntregaDias:       dto.tiempo_entrega_dias ?? null,
      codigoSigma:             dto.codigo_sigma ?? null,
    });
  }

  async findAll(query: QueryServicioDto) {
    const { datos, total } = await this.repo.findAll(query);
    const paginas = Math.ceil(total / query.limite);
    return { datos, meta: { total, pagina: query.pagina, limite: query.limite, paginas } };
  }

  async findOne(id: number) {
    const servicio = await this.repo.findById(id);
    if (!servicio) throw new ServicioNotFoundError(id);
    return servicio;
  }

  async update(id: number, dto: UpdateServicioDto) {
    const servicio = await this.repo.findById(id);
    if (!servicio) throw new ServicioNotFoundError(id);

    const tipo = servicio.tipo;
    const requiereEstampilla = dto.requiere_estampilla ?? servicio.requiereEstampilla;
    const requiereDimensiones = dto.requiere_dimensiones ?? servicio.requiereDimensiones;
    const factorVolumetrico = dto.factor_volumetrico ?? servicio.factorVolumetrico;

    validateEstampillaConsistency(requiereEstampilla, tipo);
    validateCamposPositivos(
      dto.tiempo_entrega_dias !== undefined ? dto.tiempo_entrega_dias : null,
      dto.peso_maximo_kg !== undefined ? dto.peso_maximo_kg : null,
    );
    if (requiereDimensiones) {
      validateRequiereDimensiones(requiereDimensiones, factorVolumetrico);
    }

    return this.repo.update(id, {
      nombre:                  dto.nombre,
      descripcion:             dto.descripcion,
      requiereEstampilla:      dto.requiere_estampilla,
      requiereDimensiones:     dto.requiere_dimensiones,
      requiereValorDeclarado:  dto.requiere_valor_declarado,
      pesoMaximoKg:            dto.peso_maximo_kg,
      factorVolumetrico:       dto.factor_volumetrico,
      tiempoEntregaDias:       dto.tiempo_entrega_dias,
      codigoSigma:             dto.codigo_sigma,
      activo:                  dto.activo,
    });
  }

  async remove(id: number) {
    const servicio = await this.repo.findById(id);
    if (!servicio) throw new ServicioNotFoundError(id);
    return this.repo.softDelete(id);
  }

  async assignSucursal(servicioId: number, sucursalId: number) {
    const servicio = await this.repo.findById(servicioId);
    if (!servicio) throw new ServicioNotFoundError(servicioId);

    const sucursalExists = await this.repo.sucursalExists(sucursalId);
    if (!sucursalExists) throw new ServicioSucursalNoEncontradaError(sucursalId);

    const alreadyAssigned = await this.repo.isAssigned(servicioId, sucursalId);
    if (alreadyAssigned) throw new ServicioYaAsignadoError(servicioId, sucursalId);

    return this.repo.assignSucursal(servicioId, sucursalId);
  }

  async unassignSucursal(servicioId: number, sucursalId: number) {
    const servicio = await this.repo.findById(servicioId);
    if (!servicio) throw new ServicioNotFoundError(servicioId);

    const assigned = await this.repo.isAssigned(servicioId, sucursalId);
    if (!assigned) throw new ServicioNoAsignadoError(servicioId, sucursalId);

    await this.repo.unassignSucursal(servicioId, sucursalId);
  }

  async findSucursales(servicioId: number) {
    const servicio = await this.repo.findById(servicioId);
    if (!servicio) throw new ServicioNotFoundError(servicioId);
    return this.repo.findSucursalesByServicio(servicioId);
  }
}
