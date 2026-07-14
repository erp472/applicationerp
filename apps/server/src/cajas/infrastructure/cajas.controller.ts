import {
  Controller, Get, Post, Patch,
  Body, Param, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam,
} from '@nestjs/swagger';
import { CajasService } from '../application/cajas.service.js';
import { AperturaAuxiliarSchema } from '../dto/apertura-auxiliar.dto.js';
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

const ROLES_CAJERO      = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_SUPERVISOR  = ['SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_TESORERIA   = ['TESORERIA', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_READ        = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'TESORERIA'];

@ApiTags('cajas')
@ApiBearerAuth()
@Controller('cajas')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_cajas')
@UseFilters(new CajasDomainFilter())
export class CajasController {
  constructor(private readonly service: CajasService) {}

  // ── Status / Saldo ────────────────────────────────────────────────────────

  @Get('punto/:sucursalId/status')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Estado en tiempo real de todas las cajas del punto' })
  @ApiParam({ name: 'sucursalId', type: Number })
  @ApiResponse({ status: 200, description: 'Panel + cards de cajas auxiliares' })
  async getStatusPunto(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    return CajasPresenter.toStatus(await this.service.getStatusPunto(sucursalId));
  }

  @Get('sesion/:sesionId/saldo')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Saldo actual y alertas de una sesión' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getSaldoSesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return CajasPresenter.toSesion(await this.service.getSaldoSesion(sesionId));
  }

  @Get('sesion/:sesionId/movimientos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial de movimientos de la sesión' })
  @ApiParam({ name: 'sesionId', type: Number })
  async getMovimientos(@Param('sesionId', ParseIntPipe) sesionId: number) {
    const movs = await this.service.getMovimientos(sesionId);
    return movs.map(CajasPresenter.toMovimiento);
  }

  // ── Caja Principal — operaciones ──────────────────────────────────────────

  @Post('principal/:sesionId/auxiliar/abrir')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Abrir caja auxiliar con base asignada' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja principal' })
  @ApiResponse({ status: 201, description: 'Sesión auxiliar creada' })
  @ApiResponse({ status: 409, description: 'La caja ya tiene sesión abierta' })
  @ApiResponse({ status: 422, description: 'Saldo insuficiente en principal' })
  async abrirAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { sub: number },
  ) {
    const parsed = AperturaAuxiliarSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toSesion(
      await this.service.abrirAuxiliar(sesionId, parsed.data, user.sub),
    );
  }

  @Post('principal/:sesionId/consignacion')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Registrar consignación (queda pendiente de aprobación)' })
  @ApiParam({ name: 'sesionId', type: Number })
  @ApiResponse({ status: 201, description: 'Consignación registrada en estado pendiente' })
  async registrarConsignacion(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { sub: number },
  ) {
    const parsed = ConsignacionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toConsignacion(
      await this.service.registrarConsignacion(sesionId, parsed.data, user.sub),
    );
  }

  @Patch('consignacion/:id/estado')
  @Roles(...ROLES_TESORERIA)
  @ApiOperation({ summary: 'Aprobar o rechazar consignación (tesorería/supervisor)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estado actualizado. Si aprobada, afecta la Caja Fuerte.' })
  @ApiResponse({ status: 409, description: 'La consignación ya fue procesada' })
  async aprobarConsignacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: { sub: number },
  ) {
    const parsed = AprobarConsignacionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return CajasPresenter.toConsignacion(
      await this.service.aprobarConsignacion(id, parsed.data, user.sub),
    );
  }

  @Post('principal/:sesionId/diferencia')
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

  @Post('principal/:sesionId/pago-administrativo')
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

  // ── Caja Auxiliar — operaciones ───────────────────────────────────────────

  @Post('auxiliar/:sesionId/cierre')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cierre de caja auxiliar con arqueo — entrega total a principal' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión de la caja auxiliar' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada. Si hubo diferencia, se registró automáticamente.' })
  async cerrarAuxiliar(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { sub: number },
  ) {
    const parsed = CierreCajaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const bodyObj = body as Record<string, unknown>;
    const sesionPrincipalId = Number(bodyObj['sesionPrincipalId']);
    if (!sesionPrincipalId || isNaN(sesionPrincipalId)) {
      throw new BadRequestException('Se requiere sesionPrincipalId en el body');
    }

    return CajasPresenter.toSesion(
      await this.service.cerrarAuxiliar(sesionId, parsed.data, sesionPrincipalId, user.sub),
    );
  }

  @Post('auxiliar/:sesionId/cambio-custodia')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Cambio de custodia entre sesiones' })
  @ApiParam({ name: 'sesionId', type: Number, description: 'Sesión que entrega el efectivo' })
  async cambioCustodia(
    @Param('sesionId', ParseIntPipe) sesionId: number,
    @Body() body: unknown,
    @CurrentUser() user: { sub: number },
  ) {
    const parsed = CambioCustodiaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.cambioCustodia(sesionId, parsed.data, user.sub);
  }

  @Post('auxiliar/:sesionId/diferencia')
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
