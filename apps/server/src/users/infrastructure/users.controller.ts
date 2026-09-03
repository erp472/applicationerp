import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '../application/users.service.js';
import { CreateUserSchema } from '../dto/create-user.dto.js';
import { UpdateUserSchema, UpdateOwnProfileSchema } from '../dto/update-user.dto.js';
import { QueryUserSchema } from '../dto/query-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UsersPresenter } from './users.presenter.js';
import { UsersDomainFilter } from './users-domain.filter.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

const ROLES_ADMIN   = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA'];
const ROLES_MANAGE  = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA', 'SUPERVISOR_REGIONAL'];
const ROL_ENUM      = ['CAJERO', 'ADMINISTRATIVO', 'TESORERIA', 'INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'];

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_usuarios')
@UseFilters(new UsersDomainFilter())
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @AuditKey('ADM-01')
  @Post()
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Create user', description: 'Requires ADMIN_NACIONAL or ADMIN_SISTEMA role' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'email', 'password', 'rol'],
      properties: {
        nombre:          { type: 'string', minLength: 2, maxLength: 200, example: 'Ana García' },
        email:           { type: 'string', format: 'email', example: 'ana@email.com' },
        password:        { type: 'string', minLength: 8, example: 'Secure123!' },
        rol:             { type: 'string', enum: ROL_ENUM, example: 'CAJERO' },
        sucursal_id:     { type: 'integer', nullable: true, example: 1 },
        telefono:        { type: 'string', maxLength: 20, nullable: true, example: '3001234567' },
        pais_id:         { type: 'integer', nullable: true, example: 82, description: '82 = Colombia' },
        departamento_id: { type: 'integer', nullable: true, example: 1700, description: 'Antioquia' },
        ciudad_id:       { type: 'integer', nullable: true, example: 465167, description: 'Medellín' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async create(@Body() body: unknown) {
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return UsersPresenter.toResponse(await this.service.create(parsed.data));
  }

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_MANAGE, 'ADMINISTRATIVO')
  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiQuery({ name: 'rol',         required: false, enum: ROL_ENUM })
  @ApiQuery({ name: 'sucursal_id', required: false, type: Number })
  @ApiQuery({ name: 'activo',      required: false, type: Boolean })
  @ApiQuery({ name: 'buscar',      required: false, type: String, description: 'Search by name or email' })
  @ApiQuery({ name: 'pagina',      required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite',      required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryUserSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: UsersPresenter.toList(datos), meta };
  }

  @AuditKey('ADM-04')
  @Get('me')
  @Feature('')
  @ApiOperation({ summary: 'Authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async getMe(@CurrentUser() user: { id: number }) {
    return UsersPresenter.toResponse(await this.service.findOne(user.id));
  }

  @AuditKey('ADM-02')
  @Patch('me')
  @Feature('')
  @ApiOperation({ summary: 'Update own profile (nombre, email, password, contact fields)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(
    @CurrentUser() user: { id: number },
    @Body() body: unknown,
  ) {
    const parsed = UpdateOwnProfileSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return UsersPresenter.toResponse(await this.service.update(user.id, parsed.data));
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_MANAGE, 'ADMINISTRATIVO')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return UsersPresenter.toResponse(await this.service.findOne(id));
  }

  @AuditKey('ADM-02')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Managers (SUPERVISOR_REGIONAL+) can update any field. ' +
                 'Own profile: nombre, email, password and contact fields.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre:          { type: 'string', minLength: 2 },
        email:           { type: 'string', format: 'email' },
        password:        { type: 'string', minLength: 8 },
        telefono:        { type: 'string', maxLength: 20, nullable: true },
        pais_id:         { type: 'integer', nullable: true },
        departamento_id: { type: 'integer', nullable: true },
        ciudad_id:       { type: 'integer', nullable: true },
        rol:             { type: 'string', enum: ROL_ENUM, description: 'Managers only' },
        sucursal_id:     { type: 'integer', nullable: true, description: 'Managers only' },
        activo:          { type: 'boolean', description: 'Managers only' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number; rol: string },
  ) {
    const isOwnProfile = user.id === id;
    const isManager    = ROLES_MANAGE.includes(user.rol);

    if (!isOwnProfile && !isManager) throw new ForbiddenException('Insufficient permissions');

    if (isManager) {
      const parsed = UpdateUserSchema.safeParse(body);
      if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
      return UsersPresenter.toResponse(await this.service.update(id, parsed.data));
    }

    // Perfil propio (no manager): solo nombre, email y password
    const parsed = UpdateOwnProfileSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return UsersPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @AuditKey('ADM-02')
  @Delete(':id')
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return UsersPresenter.toResponse(await this.service.remove(id));
  }
}
