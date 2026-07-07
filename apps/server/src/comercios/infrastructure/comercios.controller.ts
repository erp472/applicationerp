import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { ComerciosService } from '../application/comercios.service.js';
import { CreateComercioSchema } from '../dto/create-comercio.dto.js';
import { UpdateComercioSchema } from '../dto/update-comercio.dto.js';
import { QueryComercioSchema } from '../dto/query-comercio.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { ComerciosPresenter } from './comercios.presenter.js';
import { ComerciosDomainFilter } from './comercios-domain.filter.js';

const ROLES_READ   = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];
const ROLES_WRITE  = ['ADMIN_SISTEMA'];

@ApiTags('comercios')
@ApiBearerAuth()
@Controller('comercios')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_comercios')
@UseFilters(new ComerciosDomainFilter())
export class ComerciosController {
  constructor(private readonly service: ComerciosService) {}

  @Post()
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Crear comercio' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['codigo', 'nombre', 'nit'],
      properties: {
        codigo: { type: 'string', minLength: 2, maxLength: 20, example: '4-72' },
        nombre: { type: 'string', minLength: 2, maxLength: 200, example: 'Servicios Postales Nacionales S.A.' },
        nit:    { type: 'string', example: '830113400-3', description: 'NIT colombiano' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Comercio creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o NIT con formato incorrecto' })
  @ApiResponse({ status: 409, description: 'Código o NIT ya registrado' })
  async create(@Body() body: unknown) {
    const parsed = CreateComercioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return ComerciosPresenter.toResponse(await this.service.create(parsed.data));
  }

  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar comercios con paginación' })
  @ApiQuery({ name: 'buscar', required: false, type: String })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'pagina', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de comercios' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryComercioSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: ComerciosPresenter.toList(datos), meta };
  }

  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener comercio por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Comercio encontrado' })
  @ApiResponse({ status: 404, description: 'Comercio no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return ComerciosPresenter.toResponse(await this.service.findOne(id));
  }

  @Patch(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar comercio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', minLength: 2 },
        nit:    { type: 'string' },
        activo: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Comercio actualizado' })
  @ApiResponse({ status: 404, description: 'Comercio no encontrado' })
  @ApiResponse({ status: 409, description: 'NIT ya registrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateComercioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return ComerciosPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @Delete(':id')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Desactivar comercio (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Comercio desactivado' })
  @ApiResponse({ status: 404, description: 'Comercio no encontrado' })
  @ApiResponse({ status: 409, description: 'Tiene regionales activas' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return ComerciosPresenter.toResponse(await this.service.remove(id));
  }
}
