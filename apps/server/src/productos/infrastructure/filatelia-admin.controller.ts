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

const ROLES_ADMIN = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;

const CreateFilateliaSchema = z.object({
  codigo:      z.string().min(1).max(50),
  nombre:      z.string().min(1).max(200),
  precio:      z.number().positive(),
  serie:       z.string().max(100).optional(),
  descripcion: z.string().optional(),
});
type CreateFilateliaDto = z.infer<typeof CreateFilateliaSchema>;

const QueryFilateliaSchema = z.object({
  activo: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean()).optional(),
  buscar: z.string().optional(),
  serie:  z.string().optional(),
  pagina: z.preprocess(Number, z.number().int().positive()).default(1),
  limite: z.preprocess(Number, z.number().int().min(1).max(500)).default(20),
});

@ApiTags('admin / filatelia')
@ApiBearerAuth()
@Controller('admin/filatelia')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_productos')
@Roles(...ROLES_ADMIN)
@UseFilters(new ProductosDomainFilter())
export class FilateliaAdminController {
  constructor(private readonly service: ProductosService) {}

  @AuditKey('ADM-04')
  @Get()
  @ApiOperation({ summary: 'Listar ítems de filatelia (admin)' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'buscar', required: false, type: String })
  @ApiQuery({ name: 'serie',  required: false, type: String })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de filatelia' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryFilateliaSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll({ ...parsed.data, tipo: 'filatelia' });
    return { datos: ProductosPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener ítem de filatelia por ID (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Ítem de filatelia encontrado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.service.findOne(id);
    if (producto.tipo !== 'filatelia') throw new NotFoundException(`Filatelia ${id} no encontrada`);
    return ProductosPresenter.toResponse(producto);
  }

  @AuditKey('ADM-07')
  @Post()
  @ApiOperation({ summary: 'Registrar ítem de filatelia (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre', 'precio'],
      properties: {
        codigo:      { type: 'string', example: 'FIL-001' },
        nombre:      { type: 'string', example: 'Carpeta de Marqués' },
        precio:      { type: 'number', example: 35000 },
        serie:       { type: 'string', example: 'Carpeta de Marqués' },
        descripcion: { type: 'string', example: 'Carpeta de primer día — emisión conmemorativa' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Ítem de filatelia creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(@Body() body: unknown) {
    const parsed = CreateFilateliaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const dto: CreateFilateliaDto & { tipo: 'filatelia'; porcentaje_tax: number } = {
      ...parsed.data,
      tipo:           'filatelia',
      porcentaje_tax: 0,
    };
    return ProductosPresenter.toResponse(await this.service.create(dto));
  }

  @AuditKey('ADM-07')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ítem de filatelia (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre:      { type: 'string', example: 'Carpeta de Gabriel (actualizado)' },
        precio:      { type: 'number', example: 40000 },
        serie:       { type: 'string', example: 'Carpeta de Gabriel' },
        descripcion: { type: 'string' },
        activo:      { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ítem actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateProductoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const producto = await this.service.findOne(id);
    if (producto.tipo !== 'filatelia') throw new NotFoundException(`Filatelia ${id} no encontrada`);
    return ProductosPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-07')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar ítem de filatelia (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Ítem desactivado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.service.findOne(id);
    if (producto.tipo !== 'filatelia') throw new NotFoundException(`Filatelia ${id} no encontrada`);
    return ProductosPresenter.toResponse(await this.service.remove(id));
  }
}
