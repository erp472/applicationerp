import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PermisosService } from './permisos.service.js';
import {
  CreateRolSchema, UpdateRolSchema,
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

  // ── MATRIX ─────────────────────────────────────────────────────────────────

  @Get('matrix')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Get full Rol × Módulo × Permiso matrix' })
  getMatrix() {
    return this.service.getMatrix();
  }

  // ── ROLES ───────────────────────────────────────────────────────────────────

  @Get('roles')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'List all active roles' })
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
  findOneRol(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneRol(id);
  }

  @Patch('roles/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Update role' })
  updateRol(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdateRolSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updateRol(id, parsed.data);
  }

  @Delete('roles/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Delete role' })
  deleteRol(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteRol(id);
  }

  // ── ROL ↔ PERMISO ───────────────────────────────────────────────────────────

  @Get('roles/:rolId/permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  getPermisosDeRol(@Param('rolId', ParseIntPipe) rolId: number) {
    return this.service.getPermisosDeRol(rolId);
  }

  @Post('roles/:rolId/permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Assign permission to role' })
  asignarPermiso(@Param('rolId', ParseIntPipe) rolId: number, @Body() body: unknown) {
    const parsed = AssignPermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.asignarPermiso(rolId, parsed.data.permisos_idpermisos);
  }

  @Delete('roles/:rolId/permisos/:permisoId')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Revoke permission from role' })
  revocarPermiso(
    @Param('rolId', ParseIntPipe) rolId: number,
    @Param('permisoId', ParseIntPipe) permisoId: number,
  ) {
    return this.service.revocarPermiso(rolId, permisoId);
  }

  // ── PERMISOS ────────────────────────────────────────────────────────────────

  @Get('permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'List all permissions' })
  @ApiQuery({ name: 'modulo', required: false, description: 'Filter by module code' })
  findAllPermisos(@Query('modulo') modulo?: string) {
    return this.service.findAllPermisos(modulo);
  }

  @Post('permisos')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Create permission' })
  createPermiso(@Body() body: unknown) {
    const parsed = CreatePermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createPermiso(parsed.data);
  }

  @Patch('permisos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Update permission' })
  updatePermiso(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = UpdatePermisoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updatePermiso(id, parsed.data);
  }

  @Delete('permisos/:id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Delete permission' })
  deletePermiso(@Param('id', ParseIntPipe) id: number) {
    return this.service.deletePermiso(id);
  }
}
