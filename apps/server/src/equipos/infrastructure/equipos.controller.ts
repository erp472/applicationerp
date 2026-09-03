import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { EquiposService } from '../application/equipos.service.js';
import { CreateEquipoSchema } from '../dto/create-equipo.dto.js';
import { UpdateEquipoSchema } from '../dto/update-equipo.dto.js';
import { QueryEquipoSchema } from '../dto/query-equipo.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { EquiposPresenter } from './equipos.presenter.js';
import { EquiposDomainFilter } from './equipos-domain.filter.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_READ  = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'SUPERVISOR_REGIONAL'];
const ROLES_WRITE = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('equipos')
@ApiBearerAuth()
@Controller('equipos')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_equipos')
@UseFilters(new EquiposDomainFilter())
export class EquiposController {
  constructor(private readonly service: EquiposService) {}

  @AuditKey('ADM-01')
  @Post()
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Registrar equipo autorizado', description: 'MAC se normaliza a uppercase automáticamente. El MAC no puede reutilizarse aunque el equipo sea eliminado (#POC-AUTH-001).' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['sucursal_id', 'mac'],
      properties: {
        sucursal_id:       { type: 'integer', example: 1 },
        mac:               { type: 'string', example: 'AA:BB:CC:DD:EE:FF', description: 'Formato XX:XX:XX:XX:XX:XX' },
        nombre:            { type: 'string', nullable: true, example: 'PC Caja 1' },
        sistema_operativo: { type: 'string', enum: ['windows', 'linux', 'macos'], nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Equipo registrado' })
  @ApiResponse({ status: 400, description: 'MAC con formato inválido o sucursal no encontrada' })
  @ApiResponse({ status: 409, description: 'MAC ya registrado' })
  async create(@Body() body: unknown) {
    const parsed = CreateEquipoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return EquiposPresenter.toResponse(await this.service.create(parsed.data));
  }

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar equipos autorizados' })
  @ApiQuery({ name: 'sucursal_id',       required: false, type: Number })
  @ApiQuery({ name: 'sistema_operativo', required: false, enum: ['windows', 'linux', 'macos'] })
  @ApiQuery({ name: 'activo',            required: false, type: Boolean })
  @ApiQuery({ name: 'buscar',            required: false, type: String, description: 'Busca en MAC y nombre' })
  @ApiQuery({ name: 'pagina',            required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite',            required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de equipos' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryEquipoSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: EquiposPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener equipo por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Equipo encontrado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return EquiposPresenter.toResponse(await this.service.findOne(id));
  }

  @AuditKey('ADM-02')
  @Patch(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar equipo (nombre, SO, activo)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre:            { type: 'string', nullable: true },
        sistema_operativo: { type: 'string', enum: ['windows', 'linux', 'macos'], nullable: true },
        activo:            { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Equipo actualizado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateEquipoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return EquiposPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-02')
  @Delete(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Desautorizar equipo (soft delete — desactiva el MAC guard inmediatamente)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Equipo desautorizado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return EquiposPresenter.toResponse(await this.service.remove(id));
  }
}
