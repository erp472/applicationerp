import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, ForbiddenException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery,
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
import { ConfirmarCustodiaSchema } from '../dto/confirmar-custodia.dto.js';
import { ResolverDiferenciaSchema } from '../dto/resolver-diferencia.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CajasPresenter } from './cajas.presenter.js';
import { CajasDomainFilter } from './cajas-domain.filter.js';

const ROLES_ADMIN      = ['ADMIN_SISTEMA', 'ADMIN_NACIONAL'];                              // CRUD estructural de cajas (sin apertura de dinero)
const ROLES_GESTOR     = ['SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'];       // listar y actualizar cajas
const ROLES_SUPERVISOR = ['SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];                         // apertura/cierre de sesiones y asignación de dinero
const ROLES_CAJERO     = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_TESORERIA  = ['TESORERIA', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_READ       = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'TESORERIA'];

type AuthUser = { id: number; rol: string; sucursal_id: number | null; regional_id: number | null };

@ApiTags('cajas')
@ApiBearerAuth()
@Controller('cajas')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo:caja')
@UseFilters(new CajasDomainFilter())
export class CajasController {
  constructor(private readonly service: CajasService) {}

  // ── Superadmin CRUD /cajas ────────────────────────────────────────────────

  @Get()
  @Roles(...ROLES_GESTOR)
  @ApiOperation({ summary: 'Listar todas las cajas principales (cajaPadre)' })
  async listCajasPadres(@CurrentUser() user: AuthUser) {
    let padres;
    if (user.rol === 'SUPERVISOR_REGIONAL') {
      if (user.regional_id != null) {
        padres = await this.service.listCajasPadresByRegional(user.regional_id);
      } else if (user.sucursal_id != null) {
        padres = await this.service.listCajasPadresBySucursal(user.sucursal_id);
      } else {
        padres = [];
      }
    } else {
      padres = await this.service.listCajaPadres();
    }
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
  async getCajaPadre(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const cajaPadre = await this.service.getCajaPadre(id);
    await this.assertSucursalAccess(user, cajaPadre.sucursalId);
    return CajasPresenter.toCajaPadre(cajaPadre);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTOR)
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
  @Roles(...ROLES_GESTOR)
  @ApiOperation({ summary: 'Panel admin: todas las sucursales con caja POS y servicios' })
  async getPanelAdmin(@CurrentUser() user: AuthUser) {
    const regionalId = user.rol === 'SUPERVISOR_REGIONAL' ? (user.regional_id ?? undefined) : undefined;
    return this.service.getPanelAdmin(regionalId);
  }

  @Get('consolidado-comercio')
  @Feature('modulo:tesoreria')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Consolidado financiero nacional por medio de pago agrupado por regional' })
  @ApiQuery({ name: 'comercioId', type: Number, required: false, description: 'ID del comercio (default: 1)' })
  async getConsolidadoComercio(@Query('comercioId') comercioId?: string) {
    return this.service.getConsolidadoComercio(Number(comercioId ?? 1));
  }

  @Patch('panel-admin/:sucursalId/servicios/:servicioId')
  @Roles(...ROLES_GESTOR)
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

  // ── Asignación de cajeros (ADMIN_SISTEMA only) ────────────────────────────

  @Get('asignacion/sucursal/:sucursalId')
  @Roles('ADMIN_SISTEMA')
  @ApiOperation({ summary: 'Estructura de cajas + sesiones activas + cajero asignado por sucursal' })
  @ApiParam({ name: 'sucursalId', type: Number })
  async getAsignacionSucursal(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.service.getAsignacionSucursal(sucursalId);
  }

  @Patch('sesiones/:sesionId/cajero-asignado')
  @Roles('ADMIN_SISTEMA')
  @ApiOperation({ summary: 'Asignar o retirar cajero de una sesión activa' })
  @ApiParam({ name: 'sesionId', type: Number })
  async setCajeroAsignado(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
  ) {
    const parsed = z.object({ cajeroId: z.number().int().positive().nullable() }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.setCajeroAsignado(sesionId, parsed.data.cajeroId);
  }

  // ── Superadmin CRUD /cajas/auxiliares ────────────────────────────────────

  @Get('auxiliares')
  @Roles(...ROLES_GESTOR)
  @ApiOperation({ summary: 'Listar cajas auxiliares (pos, menor, pagos) por sucursal' })
  async listCajas(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSucursalAccess(user, sucursalId);
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
  @Roles(...ROLES_GESTOR)
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
  @ApiOperation({ summary: 'Sesión activa de una caja auxiliar (null si no tiene sesión abierta)' })
  @ApiParam({ name: 'cajaId', type: Number })
  async getSesionActiva(@Param('cajaId', ParseIntPipe) cajaId: number) {
    const sesion = await this.service.getSesionActivaByCaja(cajaId);
    return sesion ? CajasPresenter.toSesion(sesion) : null;
  }

  @Get('auxiliares/:cajaId/historial')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial de sesiones de una caja auxiliar (últimas 20)' })
  @ApiParam({ name: 'cajaId', type: Number })
  async getHistorialSesiones(@Param('cajaId', ParseIntPipe) cajaId: number) {
    const sesiones = await this.service.getHistorialSesiones(cajaId);
    return sesiones.map(CajasPresenter.toSesion);
  }

  @Get('auxiliares/:cajaId/alertas')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial completo de alertas (diferencias de cierre) por caja auxiliar (últimas 30 sesiones)' })
  @ApiParam({ name: 'cajaId', type: Number })
  async getHistorialAlertas(@Param('cajaId', ParseIntPipe) cajaId: number) {
    const sesiones = await this.service.getHistorialAlertas(cajaId);
    return sesiones.map(s => ({
      ...CajasPresenter.toSesion(s),
      diferencias: s.diferencias,
    }));
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

  // ── Cajas habilitadas por sucursal ────────────────────────────────────────

  @Get('sucursal/:sucursalId/habilitadas')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Cajas habilitadas de la sucursal agrupadas por tipo (general/pos/pagos/menor)' })
  @ApiParam({ name: 'sucursalId', type: Number })
  async getCajasHabilitadas(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSucursalAccess(user, sucursalId);
    return this.service.getCajasHabilitadas(sucursalId);
  }

  // ── Acceso por sucursalId (para sesiones con solo sucursal_id) ───────────

  @Get('sucursal/:sucursalId/status')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Estado del punto buscando por sucursalId' })
  @ApiParam({ name: 'sucursalId', type: Number })
  async getStatusPuntoBySucursal(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSucursalAccess(user, sucursalId);
    const status = await this.service.getStatusPuntoBySucursal(sucursalId);
    if (user.rol === 'CAJERO') {
      return CajasPresenter.toStatus({ ...status, cajas: status.cajas.filter(c => c.cajeroId === user.id) });
    }
    return CajasPresenter.toStatus(status);
  }

  // ── Caja Principal /cajas/principales/:cajaPadreId ────────────────────────

  @Get('principales/:cajaPadreId/status')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Estado en tiempo real de todas las cajas del punto' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  @ApiResponse({ status: 200, description: 'Panel + cards de cajas auxiliares' })
  async getStatusPunto(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const cajaPadre = await this.service.getCajaPadre(cajaPadreId);
    await this.assertSucursalAccess(user, cajaPadre.sucursalId);
    const status = await this.service.getStatusPunto(cajaPadreId);
    if (user.rol === 'CAJERO') {
      return CajasPresenter.toStatus({ ...status, cajas: status.cajas.filter(c => c.cajeroId === user.id) });
    }
    return CajasPresenter.toStatus(status);
  }

  @Post('principales/:cajaPadreId/sesion/abrir')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Abrir sesión principal (Caja Fuerte)' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  @ApiResponse({ status: 201, description: 'Sesión principal abierta' })
  @ApiResponse({ status: 409, description: 'Ya existe una sesión activa' })
  async abrirSesionPrincipal(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = AperturaPrincipalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.abrirSesionPrincipal(cajaPadreId, parsed.data, user.id),
    );
  }

  @Post('principales/:sesionId/sesion/cerrar')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Cerrar sesión principal con arqueo — requiere todas las cajas auxiliares cerradas' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja principal' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada. Diferencia registrada automáticamente si no cuadra.' })
  @ApiResponse({ status: 409, description: 'Hay cajas auxiliares con sesión abierta o la sesión ya está cerrada' })
  async cerrarSesionPrincipal(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = CierreCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.cerrarSesionPrincipal(sesionId, parsed.data, user.id);
    return { ...CajasPresenter.toSesion(result.sesion), diferenciaCierre: result.diferenciaCierre };
  }

  @Post('principales/:sesionId/auxiliar/abrir')
  @Roles(...ROLES_SUPERVISOR)
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

  @Post('principales/:sesionId/moneda-circulante')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Registrar ajuste de moneda circulante (redondeos CIPOS)' })
  @ApiParam({ name: 'sesionId', type: Number })
  @ApiResponse({ status: 201, description: 'Ajuste registrado o null si monto = 0' })
  async registrarMonedaCirculante(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
  ) {
    const parsed = z.object({ acumuladoCentavos: z.string() }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const mov = await this.service.registrarAjusteMonedaCirculante(sesionId, parsed.data.acumuladoCentavos);
    return mov ? CajasPresenter.toMovimiento(mov) : { ajuste: null, mensaje: 'Sin ajuste (monto 0)' };
  }

  @Post('principales/:sesionId/diferencia')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Registrar diferencia (sobrante o faltante) en caja principal — RF-1.03 SoD: solo supervisor' })
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

  @Get('principales/:sesionId/consignaciones')
  @Feature('modulo:tesoreria')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Listar consignaciones de la sesión principal (supervisores y tesorería)' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getConsignaciones(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const items = await this.service.getConsignaciones(sesionId);
    return items.map(CajasPresenter.toConsignacion);
  }

  // ── Consignación — aprobación compartida ─────────────────────────────────

  @Patch('consignacion/:id/estado')
  @Feature('modulo:tesoreria')
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
  async getSaldoSesion(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    return CajasPresenter.toSesion(await this.service.getSaldoSesion(sesionId));
  }

  @Get('punto/:sesionId/movimientos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial de movimientos de la sesión auxiliar' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getMovimientos(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const movs = await this.service.getMovimientos(sesionId);
    return movs.map(CajasPresenter.toMovimiento);
  }

  @Get('punto/:sesionId/reposicion-sugerida')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Monto recomendado de reposición para la sesión auxiliar (base_dia − saldo_actual)' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getReposicionSugerida(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    return this.service.getReposicionSugerida(sesionId);
  }

  @Post('punto/:sesionId/cierre')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cierre de caja auxiliar con arqueo — entrega total a principal' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja auxiliar' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada. Si hubo diferencia, se registró automáticamente.' })
  async cerrarAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const parsed = CierreCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.cerrarAuxiliar(sesionId, parsed.data, user.id);
    return { ...CajasPresenter.toSesion(result.sesion), diferenciaCierre: result.diferenciaCierre };
  }

  @Post('punto/:sesionId/cambio-custodia')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cambio de custodia entre sesiones' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión que entrega el efectivo' })
  async cambioCustodia(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const parsed = CambioCustodiaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.cambioCustodia(sesionId, parsed.data, user.id);
  }

  @Post('punto/:sesionId/diferencia')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Registrar diferencia en caja auxiliar — RF-1.03 SoD: solo supervisor' })
  @ApiParam({ name: 'sesionId', type: Number })
  async registrarDiferenciaAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const parsed = DiferenciaCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toMovimiento(
      await this.service.registrarDiferencia(sesionId, parsed.data),
    );
  }

  @Post('punto/:sesionId/medio-pago')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Registrar pago recibido por medio alterno (cheque/transferencia) en la sesión auxiliar' })
  @ApiParam({ name: 'sesionId', type: Number })
  @ApiResponse({ status: 201, description: 'Movimiento registrado con medio de pago alternativo' })
  async registrarMedioPago(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const parsed = z.object({
      tipo:         z.enum(['transferencia', 'cheque']),
      valor:        z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto debe ser numérico positivo'),
      descripcion:  z.string().max(300).optional(),
      numeroCheque: z.string().max(50).optional(),
    }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.registrarMedioPago(sesionId, parsed.data, user.id);
    return {
      ...CajasPresenter.toMovimiento(result.movimiento),
      saldoDespues: result.saldoDespues,
      alertas:      result.alertas,
    };
  }

  @Post('punto/:sesionId/traslado-boveda')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Traslado de efectivo a bóveda física durante la sesión (RF-2.02 tope máximo)' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión activa del cajero' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado. Incluye saldo antes/después y alertas activas.' })
  @ApiResponse({ status: 400, description: 'Monto supera saldo disponible o dejaría saldo bajo el mínimo operativo' })
  async registrarTrasladoBoveda(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSesionAccess(user, sesionId);
    const parsed = z.object({
      monto: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto debe ser numérico positivo'),
    }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.registrarTrasladoBoveda(sesionId, parsed.data.monto, user.id);
    return { ...CajasPresenter.toMovimiento(result.movimiento), saldoAntes: result.saldoAntes, saldoDespues: result.saldoDespues, alertas: result.alertas };
  }

  @Post('principales/:cajaPadreId/reset-automatico')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Reset automático del punto — cierra forzadamente todas las sesiones auxiliares abiertas' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  @ApiResponse({ status: 200, description: 'Sesiones cerradas. Estado forzada en cada una para auditoría (RNF-5.01).' })
  @ApiResponse({ status: 404, description: 'CajaPadre no encontrada' })
  async resetAutomaticoPunto(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const cajaPadre = await this.service.getCajaPadre(cajaPadreId);
    await this.assertSucursalAccess(user, cajaPadre.sucursalId);
    return this.service.resetAutomaticoPunto(cajaPadreId, user.id);
  }

  @Get('principales/:cajaPadreId/saldo-fuerte')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Saldo actual de la caja fuerte (sesión general del punto)' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  async getSaldoCajaFuerte(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const cajaPadre = await this.service.getCajaPadre(cajaPadreId);
    await this.assertSucursalAccess(user, cajaPadre.sucursalId);
    return this.service.getSaldoCajaFuerte(cajaPadreId);
  }

  @Get('principales/:cajaPadreId/capacidad')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Capacidad del punto: cuántas auxiliares más pueden abrir según la base disponible' })
  @ApiParam({ name: 'cajaPadreId', type: Number })
  @ApiResponse({ status: 200, description: 'Capacidad calculada' })
  async getCapacidadPunto(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @CurrentUser() user: AuthUser,
  ) {
    const cajaPadre = await this.service.getCajaPadre(cajaPadreId);
    await this.assertSucursalAccess(user, cajaPadre.sucursalId);
    return this.service.getCapacidadPunto(cajaPadreId);
  }

  // ── RF-4.01 Fase 2: confirmar recepción de remesa ────────────────────────────

  @Post('reposiciones/:codigo/confirmar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'RF-4.01 Fase 2: confirmar recepción física de la remesa e ingresar al saldo destino' })
  @ApiParam({ name: 'codigo', type: String, description: 'Código de remesa generado en la fase 1 (cambioCustodia)' })
  @ApiResponse({ status: 200, description: 'Confirmado — dinero acreditado en sesión destino' })
  @ApiResponse({ status: 409, description: 'Reposición ya procesada' })
  @ApiResponse({ status: 422, description: 'Discrepancia: monto recibido ≠ monto emitido — se abre incidente' })
  async confirmarCustodia(
    @Param('codigo') codigo: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const parsed = ConfirmarCustodiaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.confirmarCustodia(codigo, parsed.data.montoRecibido, user.id);
  }

  // ── RF-3.03: resolver diferencias pendientes ──────────────────────────────

  @Get('sucursal/:sucursalId/diferencias-pendientes')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Diferencias de cierre pendientes de resolución en todas las cajas de una sucursal' })
  @ApiParam({ name: 'sucursalId', type: Number })
  async getDiferenciasPendientesBySucursal(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSucursalAccess(user, sucursalId);
    return this.service.getDiferenciasPendientesBySucursal(sucursalId);
  }

  @Get('sucursal/:sucursalId/diferencias')
  @Roles(...ROLES_GESTOR)
  @ApiOperation({ summary: 'Registro histórico de diferencias de cierre por sucursal (informativo)' })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiQuery({ name: 'tipo',   required: false, enum: ['faltante', 'sobrante'] })
  @ApiQuery({ name: 'estado', required: false, enum: ['pendiente', 'aprobada', 'rechazada'] })
  @ApiQuery({ name: 'desde',  required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'hasta',  required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  @ApiQuery({ name: 'pagina', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de diferencias registradas. Solo lectura informativa.' })
  async getDiferenciasBySucursal(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Query() query: Record<string, string>,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertSucursalAccess(user, sucursalId);
    return this.service.getDiferenciasBySucursal(sucursalId, {
      tipo:   query['tipo']   as 'faltante' | 'sobrante' | undefined,
      estado: query['estado'] as 'pendiente' | 'aprobada' | 'rechazada' | undefined,
      desde:  query['desde'],
      hasta:  query['hasta'],
      limite: query['limite'] ? Number(query['limite']) : undefined,
      pagina: query['pagina'] ? Number(query['pagina']) : undefined,
    });
  }

  @Get('diferencias/:id')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Obtener diferencia de caja por ID' })
  @ApiParam({ name: 'id', type: Number })
  async getDiferencia(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const diferencia = await this.service.getDiferencia(id);
    await this.assertSesionAccess(user, diferencia.sesionCajaId);
    return diferencia;
  }

  @Patch('diferencias/:id/resolver')
  @Roles(...ROLES_SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'RF-3.03 + RF-1.03: supervisor aprueba o rechaza una diferencia pendiente (SoD: aprobador ≠ custodio)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Diferencia resuelta. Si aprobada, el movimiento contable queda registrado.' })
  @ApiResponse({ status: 403, description: 'RF-1.03 SoD: el aprobador es el mismo custodio responsable' })
  @ApiResponse({ status: 409, description: 'Diferencia ya fue procesada anteriormente' })
  async resolverDiferencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const diferencia = await this.service.getDiferencia(id);
    await this.assertSesionAccess(user, diferencia.sesionCajaId);
    const parsed = ResolverDiferenciaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.resolverDiferencia(id, user.id, parsed.data.estado, parsed.data.observaciones);
  }

  // ── Reportes ──────────────────────────────────────────────────────────────

  @Get('reportes/balance-pagos')
  @Feature('modulo:tesoreria')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Balance de Pagos: reposición banco/transportadora/cheque + cantidad Colpensiones por punto y fecha' })
  @ApiQuery({ name: 'fechaInicio', type: String, required: true, description: 'Fecha inicio YYYY-MM-DD (inclusive)' })
  @ApiQuery({ name: 'fechaFin',    type: String, required: true, description: 'Fecha fin YYYY-MM-DD (exclusive)' })
  async getBalancePagos(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin')    fechaFin:    string,
  ) {
    const inicio = new Date(`${fechaInicio}T00:00:00Z`);
    const fin    = new Date(`${fechaFin}T00:00:00Z`);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio >= fin) {
      throw new BadRequestException('fechaInicio y fechaFin deben ser fechas válidas y fechaInicio < fechaFin');
    }
    return this.service.getBalancePagos(inicio, fin);
  }

  @Get('alertas/cierre-automatico')
  @Roles('SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA')
  @ApiOperation({ summary: 'Sesiones abiertas que superaron la hora de reset configurada en su caja principal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: false })
  async getAlertasCierreAutomatico(
    @CurrentUser() user: AuthUser,
    @Query('sucursalId') sucursalIdRaw?: string,
  ) {
    const sucursalId = sucursalIdRaw ? Number(sucursalIdRaw) : (user.sucursal_id ?? 0);
    return this.service.getAlertasCierreAutomatico(sucursalId);
  }

  // ── Helpers de autorización ───────────────────────────────────────────────

  private async assertSucursalAccess(user: AuthUser, sucursalId: number): Promise<void> {
    if (user.rol === 'ADMIN_SISTEMA' || user.rol === 'ADMIN_NACIONAL') return;

    if (user.rol === 'SUPERVISOR_REGIONAL') {
      if (user.regional_id != null) {
        const regionalSucursal = await this.service.getSucursalRegionalId(sucursalId);
        if (regionalSucursal !== user.regional_id) {
          throw new ForbiddenException('Esta sucursal no pertenece a tu regional.');
        }
        return;
      }
      // Sin regional_id: supervisor de sucursal específica
      if (user.sucursal_id !== sucursalId) {
        throw new ForbiddenException('No tienes acceso a esta sucursal.');
      }
      return;
    }

    // CAJERO y demás roles con sucursal_id fija
    if (user.sucursal_id !== sucursalId) {
      throw new ForbiddenException('No tienes acceso a esta sucursal.');
    }
  }

  private async assertSesionAccess(user: AuthUser, sesionId: number): Promise<void> {
    if (user.rol === 'ADMIN_SISTEMA' || user.rol === 'ADMIN_NACIONAL') return;

    // RF-1.01: SUPERVISOR_REGIONAL solo puede operar sesiones dentro de su regional/sucursal
    if (user.rol === 'SUPERVISOR_REGIONAL') {
      const sucursalId = await this.service.getSucursalIdDeSesion(sesionId);
      if (sucursalId != null) await this.assertSucursalAccess(user, sucursalId);
      return;
    }

    if (user.rol === 'CAJERO') {
      const esPropietario = await this.service.esPropietarioDeSesion(sesionId, user.id);
      if (!esPropietario) throw new ForbiddenException('Solo puedes operar tu propia sesión de caja.');
    }
  }
}
