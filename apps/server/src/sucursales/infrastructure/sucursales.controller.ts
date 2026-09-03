import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { SucursalesService } from '../application/sucursales.service.js';
import { CreateSucursalSchema } from '../dto/create-sucursal.dto.js';
import { UpdateSucursalSchema } from '../dto/update-sucursal.dto.js';
import { QuerySucursalSchema } from '../dto/query-sucursal.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { SucursalesPresenter } from './sucursales.presenter.js';
import { SucursalesDomainFilter } from './sucursales-domain.filter.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_READ  = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'SUPERVISOR_REGIONAL'];
const ROLES_WRITE = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('sucursales')
@ApiBearerAuth()
@Controller('sucursales')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_sucursales')
@UseFilters(new SucursalesDomainFilter())
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @AuditKey('ADM-01')
  @Post()
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['regional_id', 'codigo', 'nombre'],
      properties: {
        regional_id:      { type: 'integer', example: 1 },
        codigo:           { type: 'string', example: 'SUC-BOG-003' },
        nombre:           { type: 'string', example: 'Bogotá Sur' },
        tipo:             { type: 'string', enum: ['unipersonal', 'multipuesto'], default: 'unipersonal' },
        direccion:        { type: 'string', nullable: true },
        telefono:         { type: 'string', nullable: true, example: '6017447000' },
        email:            { type: 'string', nullable: true, example: 'sur@4-72.com.co' },
        horario_apertura: { type: 'string', nullable: true, example: '08:00' },
        horario_cierre:   { type: 'string', nullable: true, example: '17:00' },
        pais_id:          { type: 'integer', nullable: true, example: 82 },
        departamento_id:  { type: 'integer', nullable: true, example: 1726 },
        ciudad_id:        { type: 'integer', nullable: true, example: 452468 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Sucursal creada' })
  @ApiResponse({ status: 400, description: 'Regional no existe, email inválido, horario inválido o geo inconsistente' })
  @ApiResponse({ status: 409, description: 'Código ya registrado' })
  async create(@Body() body: unknown) {
    const parsed = CreateSucursalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return SucursalesPresenter.toResponse(await this.service.create(parsed.data));
  }

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar sucursales con paginación y filtros' })
  @ApiQuery({ name: 'regional_id', required: false, type: Number })
  @ApiQuery({ name: 'ciudad_id',   required: false, type: Number })
  @ApiQuery({ name: 'tipo',        required: false, enum: ['unipersonal', 'multipuesto'] })
  @ApiQuery({ name: 'activo',      required: false, type: Boolean })
  @ApiQuery({ name: 'buscar',      required: false, type: String })
  @ApiQuery({ name: 'pagina',      required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite',      required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de sucursales' })
  async findAll(@Query() query: unknown) {
    const parsed = QuerySucursalSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: SucursalesPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener sucursal por ID (incluye regional → comercio + geo)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return SucursalesPresenter.toResponse(await this.service.findOne(id));
  }

  @AuditKey('ADM-02')
  @Patch(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateSucursalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return SucursalesPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-02')
  @Delete(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Desactivar sucursal (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Sucursal desactivada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  @ApiResponse({ status: 409, description: 'Tiene usuarios activos asignados' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return SucursalesPresenter.toResponse(await this.service.remove(id));
  }
}
