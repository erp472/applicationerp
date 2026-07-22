import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, ForbiddenException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { CajasService } from '../application/cajas.service.js';
import { CreateCajaSchema } from '../dto/create-caja.dto.js';
import { UpdateCajaSchema } from '../dto/update-caja.dto.js';
import { CreateCajaPadreSchema } from '../dto/create-caja-padre.dto.js';
import { UpdateCajaPadreSchema } from '../dto/update-caja-padre.dto.js';
import { AperturaAuxiliarSchema } from '../dto/apertura-auxiliar.dto.js';
import { AperturaPrincipalSchema } from '../dto/apertura-principal.dto.js';
import { AperturaDirectaSchema } from '../dto/apertura-directa.dto.js';
import { CierreCajaSchema } from '../dto/cierre-caja.dto.js';
import { ConsignacionSchema, AprobarConsignacionSchema } from '../dto/consignacion.dto.js';
import { DiferenciaCajaSchema } from '../dto/diferencia-caja.dto.js';
import { CambioCustodiaSchema } from '../dto/cambio-custodia.dto.js';
import { PagoAdministrativoSchema } from '../dto/pago-administrativo.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CajasPresenter } from './cajas.presenter.js';
import { CajasDomainFilter } from './cajas-domain.filter.js';

const ROLES_ADMIN      = ['ADMIN_SISTEMA'];
const ROLES_SUPERVISOR = ['SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_CAJERO     = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_TESORERIA  = ['TESORERIA', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_READ       = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'TESORERIA'];

@ApiTags('cajas')
@ApiBearerAuth()
@Controller('cajas')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_cajas')
@UseFilters(new CajasDomainFilter())
export class CajasController {
  constructor(private readonly service: CajasService) {}

  // ── Superadmin CRUD /cajas ────────────────────────────────────────────────

  @Get()
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Listar todas las cajas principales (cajaPadre)' })
  async listCajasPadres() {
    const padres = await this.service.listCajaPadres();
    return padres.map(CajasPresenter.toCajaPadre);
  }

  @Post()
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Crear caja principal (cajaPadre)' })
  @ApiResponse({ status: 201, description: 'Caja principal creada' })
  async createCajaPadre(@Body() body: unknown) {
    const parsed = CreateCajaPadreSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toCajaPadre(await this.service.createCajaPadre(parsed.data));
  }

  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener caja principal por id' })
  @ApiParam({ name: 'id', type: Number })
  async getCajaPadre(@Param('id', ParseIntPipe) id: number) {
    return CajasPresenter.toCajaPadre(await this.service.getCajaPadre(id));
  }

  @Patch(':id')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar caja principal (base mínima, hora reset, nombre)' })
  @ApiParam({ name: 'id', type: Number })
  async updateCajaPadre(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = UpdateCajaPadreSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toCajaPadre(await this.service.updateCajaPadre(id, parsed.data));
  }

  @Delete(':id')
  @Roles(...ROLES_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar caja principal (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteCajaPadre(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteCajaPadre(id);
  }

  // ── Panel Admin (sucursales + POS + servicios) ───────────────────────────

  @Get('panel-admin')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Panel admin: todas las sucursales con caja POS y servicios' })
  async getPanelAdmin() {
    return this.service.getPanelAdmin();
  }

  @Patch('panel-admin/:sucursalId/servicios/:servicioId')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Activar o desactivar un servicio en una sucursal' })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiParam({ name: 'servicioId', type: Number })
  async toggleServicio(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Param('servicioId', ParseIntPipe) servicioId: number,
    @Body() body: unknown,
  ) {
    const parsed = z.object({ activo: z.boolean() }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.toggleServicioSucursal(sucursalId, servicioId, parsed.data.activo);
  }

  // ── Superadmin CRUD /cajas/auxiliares ────────────────────────────────────

  @Get('auxiliares')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Listar cajas auxiliares (pos, menor, pagos) por sucursal' })
  async listCajas(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const isAdmin = user.rol === 'ADMIN_SISTEMA' || user.rol === 'ADMIN_NACIONAL';
    if (!isAdmin && user.sucursal_id !== sucursalId) throw new ForbiddenException('No tienes acceso a esta sucursal.');
    const cajas = await this.service.listCajas(sucursalId);
    return cajas.map(CajasPresenter.toCaja);
  }

  @Post('auxiliares')
  @Roles(...ROLES_ADMIN)
  @ApiOperation({ summary: 'Crear caja auxiliar' })
  @ApiResponse({ status: 201, description: 'Caja auxiliar creada' })
  async createCaja(@Body() body: unknown) {
    const parsed = CreateCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toCaja(await this.service.createCaja(parsed.data));
  }

  @Get('auxiliares/:id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Obtener caja auxiliar por id' })
  @ApiParam({ name: 'id', type: Number })
  async getCaja(@Param('id', ParseIntPipe) id: number) {
    return CajasPresenter.toCaja(await this.service.getCaja(id));
  }

  @Patch('auxiliares/:id')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar caja auxiliar (base, límite, tipo, nombre, etc.)' })
  @ApiParam({ name: 'id', type: Number })
  async updateCaja(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = UpdateCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toCaja(await this.service.updateCaja(id, parsed.data));
  }

  @Delete('auxiliares/:id')
  @Roles(...ROLES_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar caja auxiliar (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteCaja(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteCaja(id);
  }

  @Get('auxiliares/:cajaId/sesion-activa')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Sesión activa de una caja auxiliar (null si no tiene turno abierto)' })
  @ApiParam({ name: 'cajaId', type: Number })
  async getSesionActiva(@Param('cajaId', ParseIntPipe) cajaId: number) {
    const sesion = await this.service.getSesionActivaByCaja(cajaId);
    return sesion ? CajasPresenter.toSesion(sesion) : null;
  }

  @Post('auxiliares/:cajaId/abrir')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Abrir sesión en una caja auxiliar directamente' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiResponse({ status: 201, description: 'Sesión creada' })
  @ApiResponse({ status: 409, description: 'La caja ya tiene sesión abierta' })
  async abrirCajaDirecta(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = AperturaDirectaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.abrirCajaDirecta(cajaId, parsed.data, user.id),
    );
  }

  // ── Acceso por sucursalId (para sesiones con solo sucursal_id) ───────────

  @Get('sucursal/:sucursalId/status')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Estado del punto buscando por sucursalId' })
  @ApiParam({ name: 'sucursalId', type: Number })
  async getStatusPuntoBySucursal(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const isAdmin = user.rol === 'ADMIN_SISTEMA' || user.rol === 'ADMIN_NACIONAL';
    if (!isAdmin && user.sucursal_id !== sucursalId) throw new ForbiddenException('No tienes acceso a esta sucursal.');
    return CajasPresenter.toStatus(await this.service.getStatusPuntoBySucursal(sucursalId));
  }

  // ── Caja Principal /cajas/principales/:cajaPadreId ────────────────────────

  @Get('principales/:cajaPadreId/status')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Estado en tiempo real de todas las cajas del punto' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  @ApiResponse({ status: 200, description: 'Panel + cards de cajas auxiliares' })
  async getStatusPunto(@Param('cajaPadreId', ParseIntPipe) cajaPadreId: number) {
    return CajasPresenter.toStatus(await this.service.getStatusPunto(cajaPadreId));
  }

  @Post('principales/:cajaPadreId/turno/abrir')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Iniciar turno principal (abre sesión en la Caja Fuerte)' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  @ApiResponse({ status: 201, description: 'Turno principal iniciado' })
  @ApiResponse({ status: 409, description: 'Ya existe un turno activo' })
  async abrirTurnoPrincipal(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = AperturaPrincipalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.abrirTurnoPrincipal(cajaPadreId, parsed.data, user.id),
    );
  }

  @Post('principales/:sesionId/turno/cerrar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cerrar turno principal con arqueo — requiere todas las auxiliares cerradas' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja principal' })
  @ApiResponse({ status: 200, description: 'Turno cerrado. Diferencia registrada automáticamente si no cuadra.' })
  @ApiResponse({ status: 409, description: 'Hay auxiliares con sesión abierta o la sesión ya está cerrada' })
  async cerrarTurnoPrincipal(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = CierreCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.cerrarTurnoPrincipal(sesionId, parsed.data, user.id),
    );
  }

  @Post('principales/:sesionId/auxiliar/abrir')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Abrir caja auxiliar con base asignada' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja principal' })
  @ApiResponse({ status: 201, description: 'Sesión auxiliar creada' })
  @ApiResponse({ status: 409, description: 'La caja ya tiene sesión abierta' })
  @ApiResponse({ status: 422, description: 'Saldo insuficiente en principal' })
  async abrirAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = AperturaAuxiliarSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.abrirAuxiliar(sesionId, parsed.data, user.id),
    );
  }

  @Post('principales/:sesionId/consignacion')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Registrar consignación (queda pendiente de aprobación)' })
  @ApiParam({ name: 'sesionId', type: Number })
  @ApiResponse({ status: 201, description: 'Consignación registrada en estado pendiente' })
  async registrarConsignacion(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = ConsignacionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toConsignacion(
      await this.service.registrarConsignacion(sesionId, parsed.data, user.id),
    );
  }

  @Post('principales/:sesionId/diferencia')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Registrar diferencia (sobrante o faltante) en caja principal' })
  @ApiParam({ name: 'sesionId', type: Number })
  async registrarDiferenciaPrincipal(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
  ) {
    const parsed = DiferenciaCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toMovimiento(
      await this.service.registrarDiferencia(sesionId, parsed.data),
    );
  }

  @Post('principales/:sesionId/pago-administrativo')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Registrar pago administrativo (RETEICA, etc.)' })
  @ApiParam({ name: 'sesionId', type: Number })
  async registrarPagoAdministrativo(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
  ) {
    const parsed = PagoAdministrativoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toMovimiento(
      await this.service.registrarPagoAdministrativo(sesionId, parsed.data),
    );
  }

  // ── Consignación — aprobación compartida ─────────────────────────────────

  @Patch('consignacion/:id/estado')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Aprobar o rechazar consignación (tesorería/supervisor)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estado actualizado. Si aprobada, afecta la Caja Fuerte.' })
  @ApiResponse({ status: 409, description: 'La consignación ya fue procesada' })
  async aprobarConsignacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = AprobarConsignacionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toConsignacion(
      await this.service.aprobarConsignacion(id, parsed.data, user.id),
    );
  }

  // ── Caja Auxiliar /cajas/punto/:sesionId ─────────────────────────────────

  @Get('punto/:sesionId/saldo')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Saldo actual y alertas de la sesión auxiliar' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getSaldoSesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return CajasPresenter.toSesion(await this.service.getSaldoSesion(sesionId));
  }

  @Get('punto/:sesionId/movimientos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial de movimientos de la sesión auxiliar' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getMovimientos(@Param('sesionId', ParseIntPipe) sesionId: number) {
    const movs = await this.service.getMovimientos(sesionId);
    return movs.map(CajasPresenter.toMovimiento);
  }

  @Post('punto/:sesionId/cierre')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cierre de caja auxiliar con arqueo — entrega total a principal' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja auxiliar' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada. Si hubo diferencia, se registró automáticamente.' })
  async cerrarAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = CierreCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.cerrarAuxiliar(sesionId, parsed.data, user.id),
    );
  }

  @Post('punto/:sesionId/cambio-custodia')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cambio de custodia entre sesiones' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión que entrega el efectivo' })
  async cambioCustodia(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = CambioCustodiaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.cambioCustodia(sesionId, parsed.data, user.id);
  }

  @Post('punto/:sesionId/diferencia')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Registrar diferencia en caja auxiliar' })
  @ApiParam({ name: 'sesionId', type: Number })
  async registrarDiferenciaAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
  ) {
    const parsed = DiferenciaCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toMovimiento(
      await this.service.registrarDiferencia(sesionId, parsed.data),
    );
  }
}
