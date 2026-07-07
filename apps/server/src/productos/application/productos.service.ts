import { Inject, Injectable } from '@nestjs/common';
import type { IProductosRepository } from '../domain/producto.repository.js';
import { PRODUCTOS_REPOSITORY } from '../domain/producto.repository.js';
import type { CreateProductoDto } from '../dto/create-producto.dto.js';
import type { UpdateProductoDto } from '../dto/update-producto.dto.js';
import type { QueryProductoDto } from '../dto/query-producto.dto.js';
import {
  validateCodigoNotDuplicated, validatePrecio, calcularPrecioSinTax,
  validatePeso, validateFactorVolumetrico,
} from '../domain/business-rules.js';
import {
  ProductoNotFoundError,
  ProductoSucursalNoEncontradaError,
  ProductoYaAsignadoError,
  ProductoNoAsignadoError,
} from '../domain/producto.errors.js';

const TIPOS_VALIDOS = ['estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro'];

@Injectable()
export class ProductosService {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly repo: IProductosRepository,
  ) {}

  async create(dto: CreateProductoDto) {
    validatePrecio(dto.precio);
    validatePeso(dto.peso ?? null);
    validateFactorVolumetrico(dto.factor_volumetrico ?? null);

    const codigoExists = await this.repo.codigoExists(dto.codigo);
    validateCodigoNotDuplicated(dto.codigo, codigoExists);

    const precioSinTax = calcularPrecioSinTax(dto.precio, dto.porcentaje_tax);

    return this.repo.create({
      codigo:           dto.codigo,
      nombre:           dto.nombre,
      descripcion:      dto.descripcion ?? null,
      tipo:             dto.tipo,
      precio:           dto.precio,
      porcentajeTax:    dto.porcentaje_tax,
      precioSinTax,
      peso:             dto.peso ?? null,
      factorVolumetrico: dto.factor_volumetrico ?? null,
      imagenUrl:        dto.imagen_url ?? null,
    });
  }

  async findAll(query: QueryProductoDto) {
    const { datos, total } = await this.repo.findAll(query);
    const paginas = Math.ceil(total / query.limite);
    return { datos, meta: { total, pagina: query.pagina, limite: query.limite, paginas } };
  }

  async findOne(id: number) {
    const producto = await this.repo.findById(id);
    if (!producto) throw new ProductoNotFoundError(id);
    return producto;
  }

  async update(id: number, dto: UpdateProductoDto) {
    const producto = await this.repo.findById(id);
    if (!producto) throw new ProductoNotFoundError(id);

    const precio = dto.precio ?? producto.precio;
    const porcentajeTax = dto.porcentaje_tax ?? producto.porcentajeTax;

    if (dto.precio !== undefined) validatePrecio(dto.precio);
    if (dto.peso !== undefined) validatePeso(dto.peso);
    if (dto.factor_volumetrico !== undefined) validateFactorVolumetrico(dto.factor_volumetrico);

    const precioSinTax = calcularPrecioSinTax(precio, porcentajeTax);

    return this.repo.update(id, {
      nombre:            dto.nombre,
      descripcion:       dto.descripcion,
      precio:            dto.precio,
      porcentajeTax:     dto.porcentaje_tax,
      precioSinTax,
      peso:              dto.peso,
      factorVolumetrico: dto.factor_volumetrico,
      imagenUrl:         dto.imagen_url,
      activo:            dto.activo,
    });
  }

  async remove(id: number) {
    const producto = await this.repo.findById(id);
    if (!producto) throw new ProductoNotFoundError(id);
    return this.repo.softDelete(id);
  }

  async assignSucursal(productoId: number, sucursalId: number) {
    const producto = await this.repo.findById(productoId);
    if (!producto) throw new ProductoNotFoundError(productoId);

    const sucursalExists = await this.repo.sucursalExists(sucursalId);
    if (!sucursalExists) throw new ProductoSucursalNoEncontradaError(sucursalId);

    const alreadyAssigned = await this.repo.isAssigned(productoId, sucursalId);
    if (alreadyAssigned) throw new ProductoYaAsignadoError(productoId, sucursalId);

    return this.repo.assignSucursal(productoId, sucursalId);
  }

  async unassignSucursal(productoId: number, sucursalId: number) {
    const producto = await this.repo.findById(productoId);
    if (!producto) throw new ProductoNotFoundError(productoId);

    const assigned = await this.repo.isAssigned(productoId, sucursalId);
    if (!assigned) throw new ProductoNoAsignadoError(productoId, sucursalId);

    await this.repo.unassignSucursal(productoId, sucursalId);
  }

  async findSucursales(productoId: number) {
    const producto = await this.repo.findById(productoId);
    if (!producto) throw new ProductoNotFoundError(productoId);
    return this.repo.findSucursalesByProducto(productoId);
  }
}
