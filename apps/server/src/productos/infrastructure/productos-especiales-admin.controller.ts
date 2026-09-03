import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ProductosEspecialesService, PRECIO_MAX_ESPECIAL } from '../application/productos-especiales.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_ADMIN = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;

const TarifaSchema = z.object({
  minCantidad: z.number().int().min(0),
  maxCantidad: z.number().int().positive().nullable().default(null),
  precio:      z.number().min(0).max(PRECIO_MAX_ESPECIAL, `El precio no puede superar $${PRECIO_MAX_ESPECIAL.toLocaleString('es-CO')} COP`),
});

const CreateEspecialSchema = z.object({
  codigo:         z.string().min(1).max(50),
  nombre:         z.string().min(1).max(200),
  precio:         z.number().min(0).max(PRECIO_MAX_ESPECIAL, `El precio no puede superar $${PRECIO_MAX_ESPECIAL.toLocaleString('es-CO')} COP`),
  cantidadMinima: z.number().int().min(0).nullable().optional(),
  cantidadMaxima: z.number().int().positive().nullable().optional(),
  tarifas:        z.array(TarifaSchema).optional(),
});

const UpdateEspecialSchema = z.object({
  nombre:         z.string().min(1).max(200).optional(),
  precio:         z.number().min(0).max(PRECIO_MAX_ESPECIAL).optional(),
  cantidadMinima: z.number().int().min(0).nullable().optional(),
  cantidadMaxima: z.number().int().positive().nullable().optional(),
  activo:         z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo' });

const SetTarifasSchema = z.array(TarifaSchema);

const QueryEspecialSchema = z.object({
  activo: z.preprocess(v => v === 'true' ? true : v === 'false' ? false : v, z.boolean()).optional(),
  buscar: z.string().optional(),
  pagina: z.preprocess(Number, z.number().int().positive()).default(1),
  limite: z.preprocess(Number, z.number().int().min(1).max(500)).default(20),
});

function presente(entity: ReturnType<ProductosEspecialesService['findOne']> extends Promise<infer E> ? E : never) {
  return {
    id:             entity.id,
    codigo:         entity.codigo,
    nombre:         entity.nombre,
    precio:         entity.precio,
    cantidadMinima: entity.cantidadMinima,
    cantidadMaxima: entity.cantidadMaxima,
    activo:         entity.activo,
    createdAt:      entity.createdAt.toISOString(),
    updatedAt:      entity.updatedAt.toISOString(),
    tarifas:        entity.tarifas,
  };
}

@ApiTags('admin / productos-especiales')
@ApiBearerAuth()
@Controller('admin/productos-especiales')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_productos')
@Roles(...ROLES_ADMIN)
export class ProductosEspecialesAdminController {
  constructor(private readonly service: ProductosEspecialesService) {}

  @AuditKey('ADM-04')
  @Get()
  @ApiOperation({ summary: 'Listar productos especiales (admin)' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'buscar', required: false, type: String })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada con tarifas' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryEspecialSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: datos.map(presente), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto especial por ID (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Producto especial con sus tarifas' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return presente(await this.service.findOne(id));
  }

  @AuditKey('ADM-07')
  @Post()
  @ApiOperation({ summary: 'Crear producto especial (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre', 'precio'],
      properties: {
        codigo:         { type: 'string', example: 'SVC-DOC-NEW' },
        nombre:         { type: 'string', example: 'Nuevo servicio documental' },
        precio:         { type: 'number', example: 500, description: 'Precio base. 0 si usa tarifas por tramos. Máx $1.000.000' },
        cantidadMinima: { type: 'integer', nullable: true, example: 1 },
        cantidadMaxima: { type: 'integer', nullable: true, example: null },
        tarifas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              minCantidad: { type: 'integer', example: 1 },
              maxCantidad: { type: 'integer', nullable: true, example: 1000 },
              precio:      { type: 'number', example: 100 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Producto especial creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o precio > $1.000.000' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(@Body() body: unknown) {
    const parsed = CreateEspecialSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return presente(await this.service.create(parsed.data));
  }

  @AuditKey('ADM-07')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto especial (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre:         { type: 'string' },
        precio:         { type: 'number', description: 'Máx $1.000.000 COP' },
        cantidadMinima: { type: 'integer', nullable: true },
        cantidadMaxima: { type: 'integer', nullable: true },
        activo:         { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Producto especial actualizado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateEspecialSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return presente(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-07')
  @Put(':id/tarifas')
  @ApiOperation({ summary: 'Reemplazar tarifas por tramos (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        required: ['minCantidad', 'precio'],
        properties: {
          minCantidad: { type: 'integer', example: 1 },
          maxCantidad: { type: 'integer', nullable: true, example: 1000 },
          precio:      { type: 'number', example: 100, description: 'Máx $1.000.000 COP' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tarifas reemplazadas' })
  @ApiResponse({ status: 400, description: 'Precio > $1.000.000 o rango inválido' })
  @ApiResponse({ status: 404, description: 'Producto especial no encontrado' })
  async setTarifas(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = SetTarifasSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return presente(await this.service.setTarifas(id, parsed.data));
  }

  @AuditKey('ADM-07')
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar producto especial (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Producto especial desactivado' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return presente(await this.service.remove(id));
  }
}
