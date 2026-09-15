import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, NotFoundException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ProductosService } from '../application/productos.service.js';
import { UpdateProductoSchema } from '../dto/update-producto.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { ProductosPresenter } from './productos.presenter.js';
import { ProductosDomainFilter } from './productos-domain.filter.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_ADMIN = ['INVENTARIOS', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'] as const;
const ROLES_READ  = ['CAJERO', 'ADMINISTRATIVO', 'TESORERIA', 'INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'] as const;

export const SERIES_ESTAMPILLA = [
  'Banco de la Moneda',
  'Salto de Tequendama',
  'Laupat',
] as const;

const CreateEstampillaSchema = z.object({
  codigo: z.string().min(1).max(50),
  nombre: z.string().min(1).max(200),
  precio: z.number().positive(),
  serie:  z.string().max(100).optional(),
});
type CreateEstampillaDto = z.infer<typeof CreateEstampillaSchema>;

const QueryEstampillaSchema = z.object({
  activo: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean()).optional(),
  buscar: z.string().optional(),
  pagina: z.preprocess(Number, z.number().int().positive()).default(1),
  limite: z.preprocess(Number, z.number().int().min(1).max(500)).default(20),
});

@ApiTags('admin / estampillas')
@ApiBearerAuth()
@Controller('admin/estampillas')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_productos')
@Roles(...ROLES_ADMIN)
@UseFilters(new ProductosDomainFilter())
export class EstampillasAdminController {
  constructor(private readonly service: ProductosService) {}

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar estampillas (admin)' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'buscar', required: false, type: String })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de estampillas' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryEstampillaSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll({ ...parsed.data, tipo: 'estampilla' });
    return { datos: ProductosPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener estampilla por ID (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estampilla encontrada' })
  @ApiResponse({ status: 404, description: 'Estampilla no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.service.findOne(id);
    if (producto.tipo !== 'estampilla') throw new NotFoundException(`Estampilla ${id} no encontrada`);
    return ProductosPresenter.toResponse(producto);
  }

  @AuditKey('ADM-07')
  @Post()
  @ApiOperation({ summary: 'Crear estampilla (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre', 'precio'],
      properties: {
        codigo: { type: 'string', example: 'ES-NUEVA' },
        nombre: { type: 'string', example: 'ES Nueva Estampilla Colombia' },
        precio: { type: 'number', example: 1500 },
        serie:  { type: 'string', example: 'Banco de la Moneda', enum: [...SERIES_ESTAMPILLA] },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Estampilla creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(@Body() body: unknown) {
    const parsed = CreateEstampillaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const dto: CreateEstampillaDto & { tipo: 'estampilla'; porcentaje_tax: number } = {
      ...parsed.data,
      tipo:           'estampilla',
      porcentaje_tax: 0,
    };
    return ProductosPresenter.toResponse(await this.service.create(dto));
  }

  @AuditKey('ADM-07')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estampilla (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'ES Nombre Actualizado' },
        precio: { type: 'number', example: 2000 },
        serie:  { type: 'string', example: 'Laupat', enum: [...SERIES_ESTAMPILLA] },
        activo: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Estampilla actualizada' })
  @ApiResponse({ status: 404, description: 'Estampilla no encontrada' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateProductoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const producto = await this.service.findOne(id);
    if (producto.tipo !== 'estampilla') throw new NotFoundException(`Estampilla ${id} no encontrada`);
    return ProductosPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-07')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar estampilla (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estampilla desactivada' })
  @ApiResponse({ status: 404, description: 'Estampilla no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.service.findOne(id);
    if (producto.tipo !== 'estampilla') throw new NotFoundException(`Estampilla ${id} no encontrada`);
    return ProductosPresenter.toResponse(await this.service.remove(id));
  }
}
