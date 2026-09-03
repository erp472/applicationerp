import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FranquiciasService } from '../application/franquicias.service.js';
import {
  CrearFranquiciaSchema,
  ActualizarFranquiciaSchema,
  ActivarEnSucursalSchema,
} from '../dto/franquicia.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

// El catálogo de franquicias lo parametriza Tesorería; el cajero solo lo consulta.
const ROLES_TESORERIA = ['TESORERIA', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_READ      = ['CAJERO', 'TESORERIA', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

type AuthUser = { id: number; rol: string; sucursal_id: number | null };

@ApiTags('franquicias')
@ApiBearerAuth()
@Controller('franquicias')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo:caja')
export class FranquiciasController {
  constructor(private readonly service: FranquiciasService) {}

  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Franquicias habilitadas en la sucursal (para el datáfono del POS)' })
  @ApiQuery({ name: 'sucursalId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Franquicias activas en la sucursal' })
  async listar(@CurrentUser() user: AuthUser, @Query('sucursalId') sucursalId?: string) {
    const id = sucursalId ? Number(sucursalId) : user.sucursal_id;
    if (!id) throw new BadRequestException('sucursalId es requerido');
    return this.service.listarPorSucursal(id);
  }

  @Get('catalogo')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Catálogo completo de franquicias con su activación por sucursal' })
  async catalogo() {
    return this.service.listarCatalogo();
  }

  @Post()
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Crear franquicia' })
  @ApiResponse({ status: 409, description: 'Código ya registrado' })
  async crear(@Body() body: unknown) {
    const parsed = CrearFranquiciaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.crear(parsed.data);
  }

  @Patch(':id')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Actualizar nombre o estado de una franquicia' })
  async actualizar(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = ActualizarFranquiciaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.actualizar(id, parsed.data);
  }

  @Delete(':id')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Retirar una franquicia del catálogo (soft delete)' })
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminar(id);
  }

  @Put(':id/sucursales/:sucursalId')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Activar o desactivar la franquicia en una sucursal' })
  async activarEnSucursal(
    @Param('id', ParseIntPipe) id: number,
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Body() body: unknown,
  ) {
    const parsed = ActivarEnSucursalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.activarEnSucursal(id, sucursalId, parsed.data.activo);
  }
}
