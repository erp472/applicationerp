import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { ProductosService } from '../application/productos.service.js';
import { CreateProductoSchema } from '../dto/create-producto.dto.js';
import { UpdateProductoSchema } from '../dto/update-producto.dto.js';
import { QueryProductoSchema } from '../dto/query-producto.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { ProductosPresenter } from './productos.presenter.js';
import { ProductosDomainFilter } from './productos-domain.filter.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_WRITE = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('productos')
@ApiBearerAuth()
@Controller('productos')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_productos')
@UseFilters(new ProductosDomainFilter())
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @AuditKey('ADM-07')
  @Post()
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Registrar producto en catálogo' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre', 'tipo', 'precio'],
      properties: {
        codigo:             { type: 'string', example: 'EST-001' },
        nombre:             { type: 'string', example: 'Estampilla 4-72 Colombia' },
        descripcion:        { type: 'string', nullable: true },
        tipo:               { type: 'string', enum: ['estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro'] },
        precio:             { type: 'number', example: 11900 },
        porcentaje_tax:     { type: 'number', example: 19 },
        peso:               { type: 'number', nullable: true, example: 0.05 },
        factor_volumetrico: { type: 'number', nullable: true },
        imagen_url:         { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Producto registrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(@Body() body: unknown) {
    const parsed = CreateProductoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return ProductosPresenter.toResponse(await this.service.create(parsed.data));
  }

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_WRITE, 'SUPERVISOR_REGIONAL', 'CAJERO', 'TESORERIA')
  @ApiOperation({ summary: 'Listar productos del catálogo' })
  @ApiQuery({ name: 'tipo',   required: false, enum: ['estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro'] })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'buscar', required: false, type: String, description: 'Busca en código y nombre' })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryProductoSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: ProductosPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_WRITE, 'SUPERVISOR_REGIONAL', 'CAJERO', 'TESORERIA')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return ProductosPresenter.toResponse(await this.service.findOne(id));
  }

  @AuditKey('ADM-07')
  @Patch(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateProductoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return ProductosPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-07')
  @Delete(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Eliminar producto del catálogo (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return ProductosPresenter.toResponse(await this.service.remove(id));
  }

  @AuditKey('ADM-07')
  @Post(':id/sucursales/:sucursalId')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Asignar producto a una sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiResponse({ status: 201, description: 'Producto asignado a sucursal' })
  @ApiResponse({ status: 409, description: 'Producto ya asignado a esa sucursal' })
  async assignSucursal(
    @Param('id', ParseIntPipe) id: number,
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
  ) {
    return ProductosPresenter.toSucursalResponse(await this.service.assignSucursal(id, sucursalId));
  }

  @AuditKey('ADM-07')
  @Delete(':id/sucursales/:sucursalId')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Desasignar producto de una sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiResponse({ status: 200, description: 'Producto desasignado' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  async unassignSucursal(
    @Param('id', ParseIntPipe) id: number,
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
  ) {
    await this.service.unassignSucursal(id, sucursalId);
    return { message: 'Producto desasignado de la sucursal' };
  }

  @AuditKey('ADM-04')
  @Get(':id/sucursales')
  @Roles(...ROLES_WRITE, 'SUPERVISOR_REGIONAL')
  @ApiOperation({ summary: 'Listar sucursales activas de un producto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findSucursales(@Param('id', ParseIntPipe) id: number) {
    return ProductosPresenter.toSucursalList(await this.service.findSucursales(id));
  }
}
