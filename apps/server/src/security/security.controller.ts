import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditKey } from '../audit/decorators/audit-key.decorator.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { SecurityAlertMongo, type SecurityAlertDoc } from './security-alert.schema.js';
import type { AlertSeverity } from './security-alert.types.js';

@ApiTags('security')
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
@ApiBearerAuth()
export class SecurityController {
  constructor(
    @InjectModel(SecurityAlertMongo.name)
    private readonly alertModel: Model<SecurityAlertDoc>,
  ) {}

  @AuditKey('ADM-05')
  @Get('alerts')
  @ApiOperation({ summary: 'Últimas 50 alertas de seguridad' })
  @ApiQuery({ name: 'severidad', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiQuery({ name: 'mitre',     required: false })
  async getAlerts(
    @Query('severidad') severidad?: AlertSeverity,
    @Query('mitre')     mitre?: string,
  ) {
    const filter: Record<string, unknown> = {};
    if (severidad) filter['severidad'] = severidad;
    if (mitre)     filter['mitre']     = mitre;

    const alertas = await this.alertModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return { alertas };
  }

  @AuditKey('ADM-06')
  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de alertas del día (agrupadas por severidad)' })
  async getStats() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const porSeveridad = await this.alertModel.aggregate<{
      _id: AlertSeverity;
      total: number;
    }>([
      { $match: { timestamp: { $gte: inicio } } },
      { $group: { _id: '$severidad', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const porMitre = await this.alertModel.aggregate<{
      _id: string;
      total: number;
    }>([
      { $match: { timestamp: { $gte: inicio } } },
      { $group: { _id: '$mitre', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const total = await this.alertModel.countDocuments({
      timestamp: { $gte: inicio },
    });

    return {
      total,
      porSeveridad: Object.fromEntries(porSeveridad.map((r) => [r._id, r.total])),
      porMitre:     Object.fromEntries(porMitre.map((r) => [r._id, r.total])),
    };
  }
}
