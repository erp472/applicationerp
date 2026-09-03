import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as promClient from 'prom-client';
import { MongoAuditService } from '../audit/mongo/mongo-audit.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { CreateAuditLogDto } from '../audit/create-audit-log.dto.js';
import {
  type SecurityAlert,
  type MitreTechnique,
  type NistCsfControl,
  type AlertSeverity,
} from './security-alert.types.js';
import { SecurityAlertMongo, type SecurityAlertDoc } from './security-alert.schema.js';

const securityAlertsTotal = new promClient.Counter({
  name:       'pos472_security_alerts_total',
  help:       'Total security alerts emitted',
  labelNames: ['mitre', 'nist_csf', 'severidad'],
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type EvaluateInput = CreateAuditLogDto & {
  audit_key?: string;
  usuario_id?: number;
  ip_origen?: string;
};

@Injectable()
export class SecurityRulesService {
  private readonly logger = new Logger(SecurityRulesService.name);

  constructor(
    private readonly mongoAudit: MongoAuditService,
    private readonly realtimeService: RealtimeService,
    @InjectModel(SecurityAlertMongo.name)
    private readonly alertModel: Model<SecurityAlertDoc>,
  ) {}

  /** Evaluate all detection rules in parallel. Fire-and-forget safe — never throws. */
  async evaluate(dto: EvaluateInput): Promise<void> {
    try {
      await Promise.all([
        this.checkBruteForceLogin(dto),
        this.checkFeatureFlagDeniedAbuse(dto),
        this.checkBulkDataAccess(dto),
        this.checkAnomalousFinancialHour(dto),
        this.checkIpErrorSurge(dto),
      ]);
    } catch (err: unknown) {
      this.logger.error(
        `SecurityRulesService.evaluate error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ─── Rule 1: Brute Force Login ────────────────────────────────────────────

  private async checkBruteForceLogin(dto: EvaluateInput): Promise<void> {
    if (dto.audit_key !== 'ADM-03' || dto.resultado !== 'ERROR') return;
    if (!dto.ip_origen) return;

    const count = await this.mongoAudit.countLoginFailures(dto.ip_origen, 5);
    if (count >= 5) {
      this.emitAlert({
        id:          generateId(),
        mitre:       'T1110.001',
        nist_csf:    'DE.CM-7',
        severidad:   'CRITICAL',
        descripcion: `Brute force login detectado: ${count} intentos fallidos en 5 min desde IP ${dto.ip_origen}`,
        ip:          dto.ip_origen,
        usuario_id:  dto.usuario_id,
        audit_key:   dto.audit_key,
        timestamp:   new Date(),
        metadata:    { intentos: count, ventana_minutos: 5 },
      });
    }
  }

  // ─── Rule 2: Feature Flag Denied Abuse ───────────────────────────────────

  private async checkFeatureFlagDeniedAbuse(dto: EvaluateInput): Promise<void> {
    if (dto.resultado !== 'ERROR' || !dto.audit_key?.startsWith('ADM')) return;
    if (!dto.usuario_id) return;

    const count = await this.mongoAudit.countDeniedByUser(dto.usuario_id, 10);
    if (count >= 3) {
      this.emitAlert({
        id:          generateId(),
        mitre:       'T1562',
        nist_csf:    'DE.AE-3',
        severidad:   'HIGH',
        descripcion: `Abuso de acceso denegado: usuario ${dto.usuario_id} acumuló ${count} DENIED en 10 min`,
        ip:          dto.ip_origen,
        usuario_id:  dto.usuario_id,
        audit_key:   dto.audit_key,
        timestamp:   new Date(),
        metadata:    { intentos_denied: count, ventana_minutos: 10 },
      });
    }
  }

  // ─── Rule 3: Bulk Data Access ─────────────────────────────────────────────

  private async checkBulkDataAccess(dto: EvaluateInput): Promise<void> {
    if (dto.accion !== 'READ') return;
    if (!dto.usuario_id) return;

    const count = await this.mongoAudit.countEventsByUser(dto.usuario_id, 'READ', 5);
    if (count >= 100) {
      this.emitAlert({
        id:          generateId(),
        mitre:       'T1530',
        nist_csf:    'DE.CM-6',
        severidad:   'MEDIUM',
        descripcion: `Acceso masivo a datos: usuario ${dto.usuario_id} realizó ${count} lecturas en 5 min`,
        ip:          dto.ip_origen,
        usuario_id:  dto.usuario_id,
        audit_key:   dto.audit_key,
        timestamp:   new Date(),
        metadata:    { lecturas: count, ventana_minutos: 5 },
      });
    }
  }

  // ─── Rule 4: Anomalous Financial Operation Hour ───────────────────────────

  private async checkAnomalousFinancialHour(dto: EvaluateInput): Promise<void> {
    if (dto.tipo !== 'FIN' || dto.resultado !== 'OK') return;

    const horaUtc = new Date().getUTCHours();
    const esHoraAnomala = horaUtc < 6 || horaUtc >= 22;
    if (!esHoraAnomala) return;

    this.emitAlert({
      id:          generateId(),
      mitre:       'T1078',
      nist_csf:    'DE.AE-2',
      severidad:   'HIGH',
      descripcion: `Operación financiera fuera de horario: ${dto.accion} a las ${horaUtc}:xx UTC`,
      ip:          dto.ip_origen,
      usuario_id:  dto.usuario_id,
      audit_key:   dto.audit_key,
      timestamp:   new Date(),
      metadata:    { hora_utc: horaUtc, entidad: dto.entidad },
    });
  }

  // ─── Rule 5: IP Error Surge ───────────────────────────────────────────────

  private async checkIpErrorSurge(dto: EvaluateInput): Promise<void> {
    if (dto.resultado !== 'ERROR') return;
    if (!dto.ip_origen) return;

    const count = await this.mongoAudit.countFailuresByIp(dto.ip_origen, 2);
    if (count >= 20) {
      this.emitAlert({
        id:          generateId(),
        mitre:       'T1078',
        nist_csf:    'DE.AE-3',
        severidad:   'MEDIUM',
        descripcion: `Oleada de errores desde IP ${dto.ip_origen}: ${count} errores en 2 min`,
        ip:          dto.ip_origen,
        usuario_id:  dto.usuario_id,
        audit_key:   dto.audit_key,
        timestamp:   new Date(),
        metadata:    { errores: count, ventana_minutos: 2 },
      });
    }
  }

  // ─── Alert emission ───────────────────────────────────────────────────────

  private emitAlert(alert: SecurityAlert): void {
    // Prometheus counter
    securityAlertsTotal.inc({
      mitre:     alert.mitre,
      nist_csf:  alert.nist_csf,
      severidad: alert.severidad,
    });

    // Persist to MongoDB (fire-and-forget)
    this.alertModel.create({
      id:          alert.id,
      mitre:       alert.mitre,
      nist_csf:    alert.nist_csf,
      severidad:   alert.severidad,
      descripcion: alert.descripcion,
      ip:          alert.ip,
      usuario_id:  alert.usuario_id,
      audit_key:   alert.audit_key,
      metadata:    alert.metadata,
    }).catch((err: unknown) => {
      this.logger.error(
        `Failed to persist security alert: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    // WebSocket broadcast (fire-and-forget)
    this.realtimeService.broadcast('security.alert', alert);

    // Structured log
    this.logger.warn(JSON.stringify(alert));
  }
}
