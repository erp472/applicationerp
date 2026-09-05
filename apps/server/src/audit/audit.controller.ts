import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Readable } from 'node:stream';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuditService } from './audit.service.js';
import { ACCIONES } from './create-audit-log.dto.js';
import { AuditKey } from './decorators/audit-key.decorator.js';

/** Colombia no aplica DST, por eso el offset es fijo. Sin esto un `YYYY-MM-DD`
 *  se interpreta como medianoche UTC y el rango queda corrido 5 horas. */
const BOGOTA_OFFSET = '-05:00';
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function parseDesde(v?: string): Date | undefined {
  if (!v) return undefined;
  return new Date(SOLO_FECHA.test(v) ? `${v}T00:00:00.000${BOGOTA_OFFSET}` : v);
}

function parseHasta(v?: string): Date | undefined {
  if (!v) return undefined;
  return new Date(SOLO_FECHA.test(v) ? `${v}T23:59:59.999${BOGOTA_OFFSET}` : v);
}

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
  @ApiQuery({ name: 'accion',     required: false, enum: ACCIONES })
  @ApiQuery({ name: 'usuario_id', required: false, type: Number })
  @ApiQuery({ name: 'desde',      required: false, description: 'YYYY-MM-DD (hora Bogotá) o ISO' })
  @ApiQuery({ name: 'hasta',      required: false, description: 'YYYY-MM-DD (hora Bogotá) o ISO' })
  @ApiQuery({ name: 'pagina',     required: false, type: Number })
  @ApiQuery({ name: 'limite',     required: false, type: Number })
  findAll(
    @Query('tabla')      tabla?: string,
    @Query('operacion')  operacion?: string,
    @Query('accion')     accion?: string,
    @Query('usuario_id') usuarioId?: string,
    @Query('desde')      desde?: string,
    @Query('hasta')      hasta?: string,
    @Query('pagina')     pagina = '1',
    @Query('limite')     limite = '50',
  ) {
    return this.audit.findAll({
      tabla,
      operacion: operacion as 'INSERT' | 'UPDATE' | 'DELETE' | undefined,
      accion:    accion && (ACCIONES as readonly string[]).includes(accion) ? accion : undefined,
      usuarioId: usuarioId ? parseInt(usuarioId, 10) : undefined,
      desde:     parseDesde(desde),
      hasta:     parseHasta(hasta),
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

  @AuditKey('ADM-06', 'EXPORT')
  @Get('export')
  @ApiOperation({ summary: 'Exportar eventos de auditoría como CSV (Excel)' })
  @ApiQuery({ name: 'tabla',      required: false })
  @ApiQuery({ name: 'accion',     required: false, enum: ACCIONES })
  @ApiQuery({ name: 'usuario_id', required: false, type: Number })
  @ApiQuery({ name: 'desde',      required: false, description: 'YYYY-MM-DD (hora Bogotá) o ISO' })
  @ApiQuery({ name: 'hasta',      required: false, description: 'YYYY-MM-DD (hora Bogotá) o ISO' })
  exportCsv(
    @Res() res: FastifyReply,
    @Query('tabla')      tabla?: string,
    @Query('accion')     accion?: string,
    @Query('usuario_id') usuarioId?: string,
    @Query('desde')      desde?: string,
    @Query('hasta')      hasta?: string,
  ) {
    const csv = this.audit.exportCsv({
      tabla,
      accion: accion && (ACCIONES as readonly string[]).includes(accion) ? accion : undefined,
      usuarioId: usuarioId ? parseInt(usuarioId, 10) : undefined,
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
    });

    const filename = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    return res
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(Readable.from(csv));
  }
}
