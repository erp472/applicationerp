import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { ServiciosService } from '../application/servicios.service.js';
import { CreateServicioSchema } from '../dto/create-servicio.dto.js';
import { UpdateServicioSchema } from '../dto/update-servicio.dto.js';
import { QueryServicioSchema } from '../dto/query-servicio.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { ServiciosPresenter } from './servicios.presenter.js';
import { ServiciosDomainFilter } from './servicios-domain.filter.js';

const ROLES_WRITE = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('servicios')
@ApiBearerAuth()
@Controller('servicios')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_servicios')
@UseFilters(new ServiciosDomainFilter())
export class ServiciosController {
  constructor(private readonly service: ServiciosService) {}

  @Post()
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Registrar servicio de envío' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre', 'tipo'],
      properties: {
        codigo:                  { type: 'string', example: 'NAC-EST' },
        nombre:                  { type: 'string', example: 'Envío Nacional Estándar' },
        descripcion:             { type: 'string', nullable: true },
        tipo:                    { type: 'string', enum: ['nacional', 'internacional_ms', 'internacional_courier', 'apartado_postal'] },
        requiere_estampilla:     { type: 'boolean', example: true },
        requiere_dimensiones:    { type: 'boolean', example: true },
        requiere_valor_declarado: { type: 'boolean', example: false },
        peso_maximo_kg:          { type: 'number', nullable: true, example: 30 },
        factor_volumetrico:      { type: 'integer', example: 2500 },
        tiempo_entrega_dias:     { type: 'integer', nullable: true, example: 5 },
        codigo_sigma:            { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Servicio registrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(@Body() body: unknown) {
    const parsed = CreateServicioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return ServiciosPresenter.toResponse(await this.service.create(parsed.data));
  }

  @Get()
  @Roles(...ROLES_WRITE, 'SUPERVISOR_REGIONAL', 'CAJERO', 'TESORERIA')
  @ApiOperation({ summary: 'Listar servicios de envío' })
  @ApiQuery({ name: 'tipo',   required: false, enum: ['nacional', 'internacional_ms', 'internacional_courier', 'apartado_postal'] })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'buscar', required: false, type: String })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de servicios' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryServicioSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: ServiciosPresenter.toList(datos), meta };
  }

  @Get(':id')
  @Roles(...ROLES_WRITE, 'SUPERVISOR_REGIONAL', 'CAJERO', 'TESORERIA')
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Servicio encontrado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return ServiciosPresenter.toResponse(await this.service.findOne(id));
  }

  @Patch(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar servicio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Servicio actualizado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateServicioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return ServiciosPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @Delete(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Eliminar servicio (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Servicio eliminado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return ServiciosPresenter.toResponse(await this.service.remove(id));
  }

  @Post(':id/sucursales/:sucursalId')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Asignar servicio a una sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiResponse({ status: 201, description: 'Servicio asignado a sucursal' })
  @ApiResponse({ status: 409, description: 'Servicio ya asignado a esa sucursal' })
  async assignSucursal(
    @Param('id', ParseIntPipe) id: number,
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
  ) {
    return ServiciosPresenter.toSucursalResponse(await this.service.assignSucursal(id, sucursalId));
  }

  @Delete(':id/sucursales/:sucursalId')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Desasignar servicio de una sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiResponse({ status: 200, description: 'Servicio desasignado' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  async unassignSucursal(
    @Param('id', ParseIntPipe) id: number,
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
  ) {
    await this.service.unassignSucursal(id, sucursalId);
    return { message: 'Servicio desasignado de la sucursal' };
  }

  @Get(':id/sucursales')
  @Roles(...ROLES_WRITE, 'SUPERVISOR_REGIONAL')
  @ApiOperation({ summary: 'Listar sucursales activas de un servicio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async findSucursales(@Param('id', ParseIntPipe) id: number) {
    return ServiciosPresenter.toSucursalList(await this.service.findSucursales(id));
  }
}
