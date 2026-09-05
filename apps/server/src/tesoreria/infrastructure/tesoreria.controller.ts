import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TesoreriaService } from '../application/tesoreria.service.js';
import { RegistrarMovimientoSchema, HistorialQuerySchema } from '../dto/movimiento-tesoreria.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Feature } from '../../common/decorators/feature.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

// Tesorería mueve dinero del comercio a la regional. El tramo regional → cajas
// auxiliares es del supervisor (cambio_custodia) y no se expone aquí.
const ROLES_TESORERIA = ['TESORERIA', 'ADMIN_SISTEMA'];

type AuthUser = { id: number; rol: string; sucursal_id: number | null };

@ApiTags('tesoreria')
@ApiBearerAuth()
@Controller('tesoreria')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo:tesoreria')
@Roles(...ROLES_TESORERIA)
export class TesoreriaController {
  constructor(private readonly service: TesoreriaService) {}

  @AuditKey('ADM-04')
  @Get('cajas-principales')
  @ApiOperation({ summary: 'Cajas principales con su asignación actual y efectivo custodiado' })
  async listarCajasPrincipales() {
    return this.service.listarCajasPrincipales();
  }

  @AuditKey('ADM-06')
  @Get('movimientos')
  @ApiOperation({ summary: 'Historial de movimientos del comercio hacia las cajas principales' })
  async historial(@Query() query: unknown) {
    const parsed = HistorialQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.historial(parsed.data);
  }

  @AuditKey('FIN-02')
  @Post('cajas-principales/:cajaPadreId/apertura')
  @ApiOperation({ summary: 'Asignación inicial de dinero a la caja principal de un supervisor' })
  @ApiResponse({ status: 409, description: 'El punto ya tiene apertura o el código ya fue usado' })
  async apertura(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.registrar(cajaPadreId, 'apertura', this.parse(body), user.id);
  }

  @AuditKey('FIN-02')
  @Post('cajas-principales/:cajaPadreId/ingreso')
  @ApiOperation({ summary: 'Ingreso de dinero a la caja principal (cambio de custodio)' })
  async ingreso(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.registrar(cajaPadreId, 'ingreso', this.parse(body), user.id);
  }

  @AuditKey('FIN-04')
  @Post('cajas-principales/:cajaPadreId/egreso')
  @ApiOperation({ summary: 'Egreso de dinero de la caja principal' })
  @ApiResponse({ status: 400, description: 'Deja saldo negativo o por debajo del efectivo custodiado' })
  async egreso(
    @Param('cajaPadreId', ParseIntPipe) cajaPadreId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.registrar(cajaPadreId, 'egreso', this.parse(body), user.id);
  }

  private parse(body: unknown) {
    const parsed = RegistrarMovimientoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return parsed.data;
  }
}
