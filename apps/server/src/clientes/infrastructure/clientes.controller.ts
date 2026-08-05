import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientesService } from '../application/clientes.service.js';
import { CreateClienteSchema } from '../dto/create-cliente.dto.js';
import { UpdateClienteSchema } from '../dto/update-cliente.dto.js';
import { SearchClienteSchema } from '../dto/search-cliente.dto.js';
import { CreateTipoClienteSchema } from '../dto/create-tipo-cliente.dto.js';
import { UpdateTipoClienteSchema } from '../dto/update-tipo-cliente.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { ClientesPresenter } from './clientes.presenter.js';
import { ClientesDomainFilter } from './clientes-domain.filter.js';

const ROLES_ADMIN      = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];
const ROLES_SUPERVISOR = ['SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'];
const ROLES_CAJERO     = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA'];

@ApiTags('clientes')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo:clientes')
@UseFilters(new ClientesDomainFilter())
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  // ── Tipos de cliente ────────────────────────────────────────────────────────

  @Get('tipos')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Listar tipos de cliente' })
  async listTipos(@Query('activos') activos?: string) {
    const tipos = await this.service.listTipos(activos === 'true');
    return tipos.map(ClientesPresenter.toTipo);
  }

  @Post('tipos')
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Crear tipo de cliente' })
  async createTipo(@Body() body: unknown) {
    const dto = CreateTipoClienteSchema.parse(body);
    const tipo = await this.service.createTipo(dto);
    return ClientesPresenter.toTipo(tipo);
  }

  @Patch('tipos/:id')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar tipo de cliente' })
  async updateTipo(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateTipoClienteSchema.parse(body);
    const tipo = await this.service.updateTipo(id, dto);
    return ClientesPresenter.toTipo(tipo);
  }

  @Delete('tipos/:id')
  @Roles(...ROLES_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar tipo de cliente (soft delete)' })
  async deleteTipo(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteTipo(id);
  }

  // ── Búsqueda rápida por documento ──────────────────────────────────────────

  @Get('buscar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Buscar cliente por tipo y número de documento' })
  async buscarPorDocumento(
    @Query('tipoDocumento') tipoDocumento: string,
    @Query('numeroDocumento') numeroDocumento: string,
  ) {
    const cliente = await this.service.buscarPorDocumento(tipoDocumento, numeroDocumento);
    return cliente ? ClientesPresenter.toCliente(cliente) : null;
  }

  // ── CRUD clientes ───────────────────────────────────────────────────────────

  @Get()
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Buscar / listar clientes' })
  async search(@Query() query: unknown) {
    const dto = SearchClienteSchema.parse(query);
    const { items, total } = await this.service.search(dto);
    return {
      total,
      limit:  dto.limit,
      offset: dto.offset,
      items:  items.map(ClientesPresenter.toCliente),
    };
  }

  @Get(':id')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const c = await this.service.getById(id);
    return ClientesPresenter.toCliente(c);
  }

  @Post()
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Crear cliente' })
  async create(@Body() body: unknown) {
    const dto = CreateClienteSchema.parse(body);
    const c = await this.service.create(dto);
    return ClientesPresenter.toCliente(c);
  }

  @Patch(':id')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Actualizar datos del cliente' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateClienteSchema.parse(body);
    const c = await this.service.update(id, dto);
    return ClientesPresenter.toCliente(c);
  }
}
