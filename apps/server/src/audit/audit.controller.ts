import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuditService } from './audit.service.js';
import { AuditKey } from './decorators/audit-key.decorator.js';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_SISTEMA')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @AuditKey('ADM-05')
  @Get()
  @ApiOperation({ summary: 'Listar eventos de auditoría con filtros' })
  @ApiQuery({ name: 'tabla',      required: false })
  @ApiQuery({ name: 'operacion',  required: false, enum: ['INSERT', 'UPDATE', 'DELETE'] })
  @ApiQuery({ name: 'usuario_id', required: false, type: Number })
  @ApiQuery({ name: 'desde',      required: false, description: 'ISO date' })
  @ApiQuery({ name: 'hasta',      required: false, description: 'ISO date' })
  @ApiQuery({ name: 'pagina',     required: false, type: Number })
  @ApiQuery({ name: 'limite',     required: false, type: Number })
  findAll(
    @Query('tabla')      tabla?: string,
    @Query('operacion')  operacion?: string,
    @Query('usuario_id') usuarioId?: string,
    @Query('desde')      desde?: string,
    @Query('hasta')      hasta?: string,
    @Query('pagina')     pagina = '1',
    @Query('limite')     limite = '50',
  ) {
    return this.audit.findAll({
      tabla,
      operacion: operacion as 'INSERT' | 'UPDATE' | 'DELETE' | undefined,
      usuarioId: usuarioId ? parseInt(usuarioId, 10) : undefined,
      desde:     desde ? new Date(desde) : undefined,
      hasta:     hasta ? new Date(hasta) : undefined,
      pagina:    Math.max(1, parseInt(pagina, 10)),
      limite:    Math.min(100, Math.max(1, parseInt(limite, 10))),
    });
  }

  @AuditKey('ADM-06')
  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de auditoría del día actual' })
  stats() {
    return this.audit.statsHoy();
  }
}
