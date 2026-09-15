import {
  Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';
import { RecaudosService } from '../application/recaudos.service.js';
import { RegistrarRecaudoSchema } from '../dto/recaudos.dto.js';
import { JwtAuthGuard }    from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard }      from '../../common/guards/roles.guard.js';
import { Roles }           from '../../common/decorators/roles.decorator.js';
import { CurrentUser }     from '../../common/decorators/current-user.decorator.js';
import { VentasDomainFilter } from '../../ventas/infrastructure/ventas-domain.filter.js';

const ROLES_CAJERO = ['CAJERO', 'ADMIN_SISTEMA'] as const;
const ROLES_READ   = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;

@ApiTags('recaudos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(VentasDomainFilter)
@Controller('recaudos')
export class RecaudosController {
  constructor(private readonly service: RecaudosService) {}

  @AuditKey('OPE-02')
  @Get('convenios')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Convenios de recaudo activos para una sucursal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  async getConvenios(@Query('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.service.getConveniosBySucursal(sucursalId);
  }

  @AuditKey('FIN-01')
  @Post('punto/:cajaId/registrar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Registrar pago de recaudo — genera movimiento de caja tipo recaudo' })
  @ApiParam({ name: 'cajaId', type: Number })
  async registrarRecaudo(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = RegistrarRecaudoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.registrarRecaudo(cajaId, user.id, parsed.data);
  }

  @AuditKey('FIN-03')
  @Post(':id/anular')
  @Roles(...ROLES_CAJERO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular recaudo registrado' })
  @ApiParam({ name: 'id', type: Number })
  async anularRecaudo(@Param('id', ParseIntPipe) id: number) {
    return this.service.anularRecaudo(id);
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Detalle de un recaudo' })
  @ApiParam({ name: 'id', type: Number })
  async getRecaudo(@Param('id', ParseIntPipe) id: number) {
    return this.service.getRecaudo(id);
  }

  @AuditKey('ADM-04')
  @Get('sesion/:sesionId')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Recaudos de una sesión de caja' })
  @ApiParam({ name: 'sesionId', type: Number })
  async listBySesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return this.service.listRecaudosBySesion(sesionId);
  }
}
