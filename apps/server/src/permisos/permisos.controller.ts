import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
  ParseUUIDPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermisosService } from './permisos.service.js';
import {
  CreateRolSchema, UpdateRolSchema,
  CreateModuloSchema, UpdateModuloSchema,
  CreatePermisoSchema, UpdatePermisoSchema,
  AssignPermisoSchema,
} from './dto/permisos.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

const ADMINS = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA'];

@ApiTags('permisos')
@ApiBearerAuth()
@Controller('permisos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermisosController {
  constructor(private readonly service: PermisosService) {}

  // ── MATRIX ──────────────────────────────────────────────────────────────────

  @Get('matrix')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Get full Rol × Módulo × Permiso matrix' })
  getMatrix() {
    return this.service.getMatrix();
  }

  // ── ROLES ────────────────────────────────────────────────────────────────────

  @Get('roles')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'List all roles' })
  findAllRoles() {
    return this.service.findAllRoles();
  }

  @Post('roles')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Create role' })
  createRol(@Body() body: unknown) {
    const parsed = CreateRolSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createRol(parsed.data);
  }

  @Get('roles/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Get role by ID' })
  findOneRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneRol(id);
  }

  @Patch('roles/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Update role' })
  updateRol(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = UpdateRolSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updateRol(id, parsed.data);
  }

  @Delete('roles/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Delete role' })
  deleteRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteRol(id);
  }

  // ── ROL ↔ PERMISO ────────────────────────────────────────────────────────────

  @Get('roles/:rolId/permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  getPermisosDeRol(@Param('rolId', ParseUUIDPipe) rolId: string) {
    return this.service.getPermisosDeRol(rolId);
  }

  @Post('roles/:rolId/permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Assign permission to role' })
  asignarPermiso(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Body() body: unknown,
  ) {
    const parsed = AssignPermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.asignarPermiso(rolId, parsed.data.permisoId);
  }

  @Delete('roles/:rolId/permisos/:permisoId')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Revoke permission from role' })
  revocarPermiso(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.service.revocarPermiso(rolId, permisoId);
  }

  // ── MÓDULOS ─────────────────────────────────────────────────────────────────

  @Get('modulos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'List all modules' })
  findAllModulos() {
    return this.service.findAllModulos();
  }

  @Post('modulos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Create module' })
  createModulo(@Body() body: unknown) {
    const parsed = CreateModuloSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createModulo(parsed.data);
  }

  @Get('modulos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Get module by ID' })
  findOneModulo(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneModulo(id);
  }

  @Patch('modulos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Update module' })
  updateModulo(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = UpdateModuloSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updateModulo(id, parsed.data);
  }

  @Delete('modulos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Delete module' })
  deleteModulo(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteModulo(id);
  }

  // ── PERMISOS (acciones) ──────────────────────────────────────────────────────

  @Get('permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'List all permissions' })
  findAllPermisos() {
    return this.service.findAllPermisos();
  }

  @Post('permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Create permission within a module' })
  createPermiso(@Body() body: unknown) {
    const parsed = CreatePermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createPermiso(parsed.data);
  }

  @Patch('permisos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Update permission' })
  updatePermiso(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = UpdatePermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updatePermiso(id, parsed.data);
  }

  @Delete('permisos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Delete permission' })
  deletePermiso(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deletePermiso(id);
  }
}
