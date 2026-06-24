import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
  ParseUUIDPipe,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '../application/users.service.js';
import { CreateUsuarioSchema } from '../dto/create-usuario.dto.js';
import { UpdateUsuarioSchema } from '../dto/update-usuario.dto.js';
import { QueryUsuarioSchema } from '../dto/query-usuario.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UsuariosPresenter } from './usuarios.presenter.js';
import { UsuariosDomainFilter } from './usuarios-domain.filter.js';

const ROLES_ADMIN = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA'];
const ROLES_GESTION = ['ADMIN_NACIONAL', 'ADMIN_SISTEMA', 'SUPERVISOR_REGIONAL'];

const ROL_ENUM = ['CAJERO', 'ADMINISTRATIVO', 'TESORERIA', 'INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'];

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(new UsuariosDomainFilter())
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Crear usuario', description: 'Requiere rol ADMIN_NACIONAL o ADMIN_SISTEMA' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'email', 'password', 'rol'],
      properties: {
        nombre:      { type: 'string', minLength: 2, maxLength: 200, example: 'Ana García' },
        email:       { type: 'string', format: 'email', example: 'ana@4-72.com.co' },
        password:    { type: 'string', minLength: 8, example: 'Segura123!' },
        rol:         { type: 'string', enum: ROL_ENUM, example: 'CAJERO' },
        sucursal_id: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async create(@Body() body: unknown) {
    const parsed = CreateUsuarioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const usuario = await this.service.create(parsed.data);
    return UsuariosPresenter.toResponse(usuario);
  }

  @Get()
  @Roles(...ROLES_GESTION, 'ADMINISTRATIVO')
  @ApiOperation({ summary: 'Listar usuarios con paginación y filtros' })
  @ApiQuery({ name: 'rol',         required: false, enum: ROL_ENUM })
  @ApiQuery({ name: 'sucursal_id', required: false, type: String })
  @ApiQuery({ name: 'activo',      required: false, type: Boolean })
  @ApiQuery({ name: 'buscar',      required: false, type: String, description: 'Búsqueda por nombre o email' })
  @ApiQuery({ name: 'pagina',      required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limite',      required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuarios' })
  async findAll(@Query() query: unknown) {
    const parsed = QueryUsuarioSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { datos, meta } = await this.service.findAll(parsed.data);
    return { datos: UsuariosPresenter.toList(datos), meta };
  }

  @Get('me')
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  async getMe(@CurrentUser() user: { id: string }) {
    const usuario = await this.service.findOne(user.id);
    return UsuariosPresenter.toResponse(usuario);
  }

  @Get(':id')
  @Roles(...ROLES_GESTION, 'ADMINISTRATIVO')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const usuario = await this.service.findOne(id);
    return UsuariosPresenter.toResponse(usuario);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Actualizar usuario' })
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
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: string; rol: string },
  ) {
    const esPropioPeril = user.id === id;
    const tienePermiso = ROLES_GESTION.includes(user.rol);
    if (!esPropioPeril && !tienePermiso) {
      throw new ForbiddenException('Sin permisos para editar este usuario');
    }
    const parsed = UpdateUsuarioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const usuario = await this.service.update(id, parsed.data);
    return UsuariosPresenter.toResponse(usuario);
  }

  @Delete(':id')
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Desactivar usuario (soft delete)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
