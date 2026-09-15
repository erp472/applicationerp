import {
  Controller, Get, Post,
  Body, Param, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam,
} from '@nestjs/swagger';
import { GirosService }                from '../application/giros.service.js';
import {
  EmitirGiroNacionalSchema,
  PagarGiroNacionalSchema,
  EmitirGiroInternacionalSchema,
  PagarGiroInternacionalSchema,
} from '../dto/giros.dto.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';
import { JwtAuthGuard }           from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard }             from '../../common/guards/roles.guard.js';
import { Roles }                  from '../../common/decorators/roles.decorator.js';
import { CurrentUser }            from '../../common/decorators/current-user.decorator.js';
import { VentasDomainFilter }     from '../../ventas/infrastructure/ventas-domain.filter.js';

const ROLES_CAJERO = ['CAJERO', 'ADMIN_SISTEMA'];
const ROLES_READ   = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('giros')
@ApiBearerAuth()
@Controller('giros')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(new VentasDomainFilter())
export class GirosController {
  constructor(private readonly service: GirosService) {}

  // ── Giros Nacionales ──────────────────────────────────────────────────────────

  @AuditKey('FIN-01')
  @Post('punto/:cajaId/nacional/emitir')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Emitir giro nacional 4-72' })
  @ApiParam({ name: 'cajaId', type: Number })
  async emitirGiroNacional(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = EmitirGiroNacionalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.emitirGiroNacional(cajaId, user.id, parsed.data);
  }

  @AuditKey('FIN-01')
  @Post('punto/:cajaId/nacional/pagar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Pagar giro nacional por PIN' })
  @ApiParam({ name: 'cajaId', type: Number })
  async pagarGiroNacional(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = PagarGiroNacionalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.pagarGiroNacional(cajaId, user.id, parsed.data);
  }

  // ── Giros Internacionales ─────────────────────────────────────────────────────

  @AuditKey('FIN-01')
  @Post('punto/:cajaId/internacional/emitir')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Emitir giro internacional (MoneyGram / Ria / IFS)' })
  @ApiParam({ name: 'cajaId', type: Number })
  async emitirGiroInternacional(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = EmitirGiroInternacionalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.emitirGiroInternacional(cajaId, user.id, parsed.data);
  }

  @AuditKey('FIN-01')
  @Post('punto/:cajaId/internacional/pagar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Pagar giro internacional validando PIN y datos del beneficiario' })
  @ApiParam({ name: 'cajaId', type: Number })
  async pagarGiroInternacional(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = PagarGiroInternacionalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.pagarGiroInternacional(cajaId, user.id, parsed.data);
  }

  // ── Operaciones sobre giro individual ─────────────────────────────────────────

  @AuditKey('FIN-03')
  @Post(':id/anular')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Anular giro por ID' })
  @ApiParam({ name: 'id', type: Number })
  async anularGiro(@Param('id', ParseIntPipe) id: number) {
    return this.service.anularGiro(id);
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Consultar detalle de un giro' })
  @ApiParam({ name: 'id', type: Number })
  async getGiro(@Param('id', ParseIntPipe) id: number) {
    return this.service.getGiro(id);
  }

  @AuditKey('ADM-04')
  @Get('sesion/:sesionId')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar giros de una sesión de caja' })
  @ApiParam({ name: 'sesionId', type: Number })
  async listGirosBySesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return this.service.listGirosBySesion(sesionId);
  }
}
