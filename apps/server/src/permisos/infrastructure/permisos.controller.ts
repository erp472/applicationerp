import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, UseFilters,
  ParseUUIDPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PermisosService } from '../application/permisos.service.js';
import { CreateRolSchema, UpdateRolSchema }         from '../dto/create-rol.dto.js';
import { CreatePermisoSchema, UpdatePermisoSchema } from '../dto/create-permiso.dto.js';
import { AssignPermisoSchema }                      from '../dto/assign-permiso.dto.js';
import { JwtAuthGuard }  from '../../common/guards/jwt-auth.guard.js';
import { CanGuard }      from '../../common/guards/can.guard.js';
import { Can }           from '../../common/decorators/can.decorator.js';
import { PermisosDomainFilter } from './permisos-domain.filter.js';

const SOLO_ADMIN = { rol: 'ADMIN_SISTEMA' } as const;

@ApiTags('permisos')
@ApiBearerAuth()
@Controller('permisos')
@UseGuards(JwtAuthGuard, CanGuard)
@UseFilters(new PermisosDomainFilter())
export class PermisosController {
  constructor(private readonly service: PermisosService) {}

  // ─── ROLES ─────────────────────────────────────────────────────────────────
  @Get('roles')
  @Can({ rol: 'ADMIN_SISTEMA' })
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles con sus permisos' })
  findAllRoles() {
    return this.service.findAllRoles();
  }

  @Get('roles/:id')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  findOneRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneRol(id);
  }

  @Post('roles')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Crear rol' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre'],
      properties: { nombre: { type: 'string', example: 'Gerente Regional' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Rol creado' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  async createRol(@Body() body: unknown) {
    const parsed = CreateRolSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createRol(parsed.data);
  }

  @Patch('roles/:id')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async updateRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateRolSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updateRol(id, parsed.data);
  }

  @Delete('roles/:id')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Eliminar rol' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Rol eliminado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  removeRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeRol(id);
  }

  // ─── PERMISOS ──────────────────────────────────────────────────────────────
  @Get('permisos')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Listar todos los permisos' })
  findAllPermisos() {
    return this.service.findAllPermisos();
  }

  @Get('permisos/:id')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Obtener permiso por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  findOnePermiso(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOnePermiso(id);
  }

  @Post('permisos')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Crear permiso' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre'],
      properties: { nombre: { type: 'string', example: 'modo_pos' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Permiso creado' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  async createPermiso(@Body() body: unknown) {
    const parsed = CreatePermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createPermiso(parsed.data);
  }

  @Patch('permisos/:id')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Actualizar permiso' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async updatePermiso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdatePermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updatePermiso(id, parsed.data);
  }

  @Delete('permisos/:id')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Eliminar permiso' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  removePermiso(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removePermiso(id);
  }

  // ─── ASIGNACIÓN ROL ↔ PERMISO ───────────────────────────────────────────────
  @Get('roles/:id/permisos')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Obtener permisos de un rol' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  getPermisosDeRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPermisosDeRol(id);
  }

  @Post('roles/:id/permisos')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Asignar permiso a un rol' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['permisoId'],
      properties: { permisoId: { type: 'string', format: 'uuid' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Permiso asignado' })
  @ApiResponse({ status: 409, description: 'Ya estaba asignado' })
  async asignarPermiso(
    @Param('id', ParseUUIDPipe) rolId: string,
    @Body() body: unknown,
  ) {
    const parsed = AssignPermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.asignarPermiso(rolId, parsed.data.permisoId);
  }

  @Delete('roles/:rolId/permisos/:permisoId')
  @Can(SOLO_ADMIN)
  @ApiOperation({ summary: 'Revocar permiso de un rol' })
  @ApiParam({ name: 'rolId',     type: String, format: 'uuid' })
  @ApiParam({ name: 'permisoId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permiso revocado' })
  revocarPermiso(
    @Param('rolId',     ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.service.revocarPermiso(rolId, permisoId);
  }
}
