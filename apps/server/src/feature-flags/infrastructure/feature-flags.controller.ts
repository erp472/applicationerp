import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FeatureFlagsService } from '../application/feature-flags.service.js';
import {
  CreateFeatureFlagSchema,
  UpdateFeatureFlagSchema,
  AssignRolSchema,
  AssignUsuarioSchema,
} from '../dto/feature-flag.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { FeatureFlagsPresenter } from './feature-flags.presenter.js';
import { FeatureFlagsDomainFilter } from './feature-flags-domain.filter.js';

interface AuthUser {
  id: number;
  rol: string;
}

@ApiTags('feature-flags')
@Controller('feature-flags')
@UseFilters(new FeatureFlagsDomainFilter())
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  // ── Endpoint público (autenticado) para el frontend ──────────────────────────
  // Filtra por segmentación: solo devuelve flags que aplican al rol/usuario actual.
  @Get('activos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature flags activos para el usuario y entorno actuales' })
  @ApiQuery({ name: 'entorno',    required: false, enum: ['all', 'dev', 'staging', 'prod'] })
  @ApiQuery({ name: 'plataforma', required: false, enum: ['all', 'web', 'tauri'] })
  async getActivos(
    @Query('entorno')    entorno    = 'dev',
    @Query('plataforma') plataforma = 'all',
    @CurrentUser() user: AuthUser,
  ) {
    const activos = await this.service.getActivos(entorno, { rol: user.rol, usuarioId: user.id, plataforma });
    return FeatureFlagsPresenter.toList(activos);
  }

  // ── CRUD — solo ADMIN_SISTEMA ─────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los feature flags' })
  @ApiQuery({ name: 'entorno', required: false })
  async findAll(@Query('entorno') entorno?: string) {
    return FeatureFlagsPresenter.toList(await this.service.findAll(entorno));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un feature flag por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return FeatureFlagsPresenter.toResponse(await this.service.findOne(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear feature flag' })
  async create(@Body() body: unknown) {
    const parsed = CreateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return FeatureFlagsPresenter.toResponse(await this.service.create(parsed.data));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar feature flag' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return FeatureFlagsPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar feature flag' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ── Segmentación por rol ──────────────────────────────────────────────────────
  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar el flag para un rol específico' })
  async asignarRol(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = AssignRolSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return FeatureFlagsPresenter.toResponse(await this.service.asignarRol(id, parsed.data.rolId));
  }

  @Delete(':id/roles/:rolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar la restricción de rol' })
  async revocarRol(@Param('id', ParseIntPipe) id: number, @Param('rolId', ParseIntPipe) rolId: number) {
    return FeatureFlagsPresenter.toResponse(await this.service.revocarRol(id, rolId));
  }

  // ── Segmentación por usuario ──────────────────────────────────────────────────
  @Post(':id/usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar el flag para un usuario específico' })
  async asignarUsuario(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = AssignUsuarioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return FeatureFlagsPresenter.toResponse(await this.service.asignarUsuario(id, parsed.data.usuarioId));
  }

  @Delete(':id/usuarios/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar la restricción de usuario' })
  async revocarUsuario(@Param('id', ParseIntPipe) id: number, @Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return FeatureFlagsPresenter.toResponse(await this.service.revocarUsuario(id, usuarioId));
  }
}
