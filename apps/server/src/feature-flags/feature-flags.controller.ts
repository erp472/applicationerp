import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service.js';
import {
  CreateFeatureFlagSchema,
  UpdateFeatureFlagSchema,
} from './dto/feature-flag.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  // ── Endpoint público (autenticado) para el frontend ──────────────────────────
  @Get('activos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature flags activos para el entorno dado' })
  @ApiQuery({ name: 'entorno', required: false, enum: ['all', 'dev', 'staging', 'prod'] })
  getActivos(@Query('entorno') entorno = 'dev') {
    return this.service.getActivos(entorno);
  }

  // ── CRUD — solo ADMIN_SISTEMA ─────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los feature flags' })
  @ApiQuery({ name: 'entorno', required: false })
  findAll(@Query('entorno') entorno?: string) {
    return this.service.findAll(entorno);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un feature flag por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear feature flag' })
  create(@Body() body: unknown) {
    const parsed = CreateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.create(parsed.data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar feature flag' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.update(id, parsed.data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar feature flag' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
