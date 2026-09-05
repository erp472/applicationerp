import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { RegionalesService } from '../application/regionales.service.js';
import { CreateRegionalSchema } from '../dto/create-regional.dto.js';
import { UpdateRegionalSchema } from '../dto/update-regional.dto.js';
import { QueryRegionalSchema } from '../dto/query-regional.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { RegionalesPresenter } from './regionales.presenter.js';
import { RegionalesDomainFilter } from './regionales-domain.filter.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_READ  = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'SUPERVISOR_REGIONAL'];
const ROLES_WRITE = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('regionales')
@ApiBearerAuth()
@Controller('regionales')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_regionales')
@UseFilters(new RegionalesDomainFilter())
export class RegionalesController {
  constructor(private readonly service: RegionalesService) {}

  @AuditKey('ADM-01')
  @Post()
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Crear regional' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['comercio_id', 'codigo', 'nombre'],
      properties: {
        comercio_id: { type: 'integer', example: 1 },
        codigo:      { type: 'string', minLength: 2, maxLength: 20, example: 'REG-BOG' },
        nombre:      { type: 'string', minLength: 2, maxLength: 200, example: 'Regional Bogotá' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Regional creada' })
  @ApiResponse({ status: 400, description: 'Comercio no encontrado o datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código ya registrado' })
  async create(@Body() body: unknown) {
    const parsed = CreateRegionalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return RegionalesPresenter.toResponse(await this.service.create(parsed.data));
  }

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar regionales con paginación y filtros' })
  @ApiQuery({ name: 'comercio_id', required: false, type: Number })
  @ApiQuery({ name: 'buscar',      required: false, type: String })
  @ApiQuery({ name: 'activo',      required: false, type: Boolean })
  @ApiQuery({ name: 'pagina',      required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite',      required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de regionales' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryRegionalSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: RegionalesPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener regional por ID (incluye comercio)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Regional encontrada' })
  @ApiResponse({ status: 404, description: 'Regional no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return RegionalesPresenter.toResponse(await this.service.findOne(id));
  }

  @AuditKey('ADM-02')
  @Patch(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar regional' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', minLength: 2 },
        activo: { type: 'boolean', description: 'Requiere 0 sucursales activas para desactivar' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Regional actualizada' })
  @ApiResponse({ status: 404, description: 'Regional no encontrada' })
  @ApiResponse({ status: 409, description: 'Tiene sucursales activas' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateRegionalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return RegionalesPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-02')
  @Delete(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Desactivar regional (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Regional desactivada' })
  @ApiResponse({ status: 404, description: 'Regional no encontrada' })
  @ApiResponse({ status: 409, description: 'Tiene sucursales activas' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return RegionalesPresenter.toResponse(await this.service.remove(id));
  }

  @AuditKey('ADM-06')
  @Get(':id/consolidado')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Consolidado financiero de la regional agrupado por medio de pago' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Consolidado con total y desglose por medio de pago' })
  @ApiResponse({ status: 404, description: 'Regional no encontrada' })
  async getConsolidado(@Param('id', ParseIntPipe) id: number) {
    return this.service.getConsolidadoRegional(id);
  }

  @AuditKey('ADM-04')
  @Get(':id/sucursales-activas')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Resumen de sucursales activas vs inactivas hoy en la regional' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Conteos y porcentaje de sucursales con sesión abierta hoy' })
  @ApiResponse({ status: 404, description: 'Regional no encontrada' })
  async getSucursalesActivas(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSucursalesActivas(id);
  }
}
