import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseUUIDPipe, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse,
  ApiBody, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '../application/users.service.js';
import { CreateUserSchema } from '../dto/create-user.dto.js';
import { UpdateUserSchema } from '../dto/update-user.dto.js';
import { QueryUserSchema } from '../dto/query-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UsersPresenter } from './users.presenter.js';
import { UsersDomainFilter } from './users-domain.filter.js';

const ROLES_ADMIN   = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA'];
const ROLES_MANAGE  = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA', 'SUPERVISOR_REGIONAL'];
const ROL_ENUM      = ['CAJERO', 'ADMINISTRATIVO', 'TESORERIA', 'INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'];

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(new UsersDomainFilter())
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Create user', description: 'Requires ADMIN_NACIONAL or ADMIN_SISTEMA role' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'email', 'password', 'rol'],
      properties: {
        nombre:      { type: 'string', minLength: 2, maxLength: 200, example: 'Ana García' },
        email:       { type: 'string', format: 'email', example: 'ana@4-72.com.co' },
        password:    { type: 'string', minLength: 8, example: 'Secure123!' },
        rol:         { type: 'string', enum: ROL_ENUM, example: 'CAJERO' },
        sucursal_id: { type: 'string', format: 'uuid', nullable: true },
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

  @Get()
  @Roles(...ROLES_MANAGE, 'ADMINISTRATIVO')
  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiQuery({ name: 'rol',         required: false, enum: ROL_ENUM })
  @ApiQuery({ name: 'sucursal_id', required: false, type: String })
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

  @Get('me')
  @ApiOperation({ summary: 'Authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async getMe(@CurrentUser() user: { id: string }) {
    return UsersPresenter.toResponse(await this.service.findOne(user.id));
  }

  @Get(':id')
  @Roles(...ROLES_MANAGE, 'ADMINISTRATIVO')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return UsersPresenter.toResponse(await this.service.findOne(id));
  }

  @Patch(':id')
  @Roles(...ROLES_MANAGE)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre:      { type: 'string', minLength: 2 },
        email:       { type: 'string', format: 'email' },
        password:    { type: 'string', minLength: 8 },
        rol:         { type: 'string', enum: ROL_ENUM },
        sucursal_id: { type: 'string', format: 'uuid', nullable: true },
        activo:      { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    const isOwnProfile = user.id === id;
    const hasPermission = ROLES_MANAGE.includes(user.rol);
    if (!isOwnProfile && !hasPermission) throw new ForbiddenException('Insufficient permissions');

    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return UsersPresenter.toResponse(await this.service.update(id, parsed.data));
  }

  @Delete(':id')
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
