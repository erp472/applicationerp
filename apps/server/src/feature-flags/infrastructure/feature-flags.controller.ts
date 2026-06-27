import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, UseFilters,
  ParseUUIDPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiBody, ApiResponse,
} from '@nestjs/swagger';
import { FeatureFlagsService }     from '../application/feature-flags.service.js';
import { CreateFeatureFlagSchema, UpdateFeatureFlagSchema } from '../dto/create-feature-flag.dto.js';
import { JwtAuthGuard }            from '../../common/guards/jwt-auth.guard.js';
import { CanGuard }                from '../../common/guards/can.guard.js';
import { Can }                     from '../../common/decorators/can.decorator.js';
import { FeatureFlagsDomainFilter } from './feature-flags-domain.filter.js';

const MODOS = ['PRODUCCION', 'AB_TEST', 'INACTIVO'];
const SOLO_SUPER = { rol: 'ADMIN_SISTEMA' } as const;

@ApiTags('feature-flags')
@ApiBearerAuth()
@Controller('feature-flags')
@UseGuards(JwtAuthGuard, CanGuard)
@UseFilters(new FeatureFlagsDomainFilter())
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get()
  @Can(SOLO_SUPER)
  @ApiOperation({ summary: 'Listar todos los feature flags' })
  @ApiResponse({ status: 200, description: 'Lista de feature flags' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Can(SOLO_SUPER)
  @ApiOperation({ summary: 'Obtener feature flag por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Can(SOLO_SUPER)
  @ApiOperation({ summary: 'Crear feature flag' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre'],
      properties: {
        nombre:      { type: 'string', example: 'modo_pos' },
        modo:        { type: 'string', enum: MODOS, default: 'PRODUCCION' },
        descripcion: { type: 'string', nullable: true, example: 'Activa el módulo de punto de venta' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Feature flag creado' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  async create(@Body() body: unknown) {
    const parsed = CreateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.create(parsed.data);
  }

  @Patch(':id')
  @Can(SOLO_SUPER)
  @ApiOperation({ summary: 'Cambiar modo / descripción de un feature flag' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        modo:        { type: 'string', enum: MODOS },
        descripcion: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Feature flag actualizado — cache invalidado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.update(id, parsed.data);
  }

  @Delete(':id')
  @Can(SOLO_SUPER)
  @ApiOperation({ summary: 'Eliminar feature flag' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Feature flag eliminado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
