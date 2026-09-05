import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as promClient from 'prom-client';
import { MongoAuditService } from '../audit/mongo/mongo-audit.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { CreateAuditLogDto } from '../audit/create-audit-log.dto.js';
import { CBS_CATALOG, type SecurityAlert, type CbsCode } from './security-alert.types.js';
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
      this.emitAlert('CBS-01', dto, {
        descripcion: `Brute force login detectado: ${count} intentos fallidos en 5 min desde IP ${dto.ip_origen}`,
        metadata:    { intentos: count, ventana_minutos: 5 },
      });
    }
  }

  // ─── Rule 2: Feature Flag Denied Abuse ───────────────────────────────────

  private async checkFeatureFlagDeniedAbuse(dto: EvaluateInput): Promise<void> {
    // Debe dispararla un acceso denegado, no cualquier error administrativo: si no,
    // un usuario con DENIED previos recibe alerta cada vez que falla un reporte o un cierre.
    if (dto.accion !== 'DENIED') return;
    if (!dto.usuario_id) return;

    const count = await this.mongoAudit.countDeniedByUser(dto.usuario_id, 10);
    if (count >= 3) {
      this.emitAlert('CBS-02', dto, {
        descripcion: `Abuso de acceso denegado: usuario ${dto.usuario_id} acumuló ${count} DENIED en 10 min`,
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
      this.emitAlert('CBS-03', dto, {
        descripcion: `Acceso masivo a datos: usuario ${dto.usuario_id} realizó ${count} lecturas en 5 min`,
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

    this.emitAlert('CBS-04', dto, {
      descripcion: `Operación financiera fuera de horario: ${dto.accion} a las ${horaUtc}:xx UTC`,
      metadata:    { hora_utc: horaUtc, entidad: dto.entidad },
    });
  }

  // ─── Rule 5: IP Error Surge ───────────────────────────────────────────────

  private async checkIpErrorSurge(dto: EvaluateInput): Promise<void> {
    if (dto.resultado !== 'ERROR') return;
    if (!dto.ip_origen) return;

    const count = await this.mongoAudit.countFailuresByIp(dto.ip_origen, 2);
    if (count >= 20) {
      this.emitAlert('CBS-05', dto, {
        descripcion: `Oleada de errores desde IP ${dto.ip_origen}: ${count} errores en 2 min`,
        metadata:    { errores: count, ventana_minutos: 2 },
      });
    }
  }

  // ─── Alert emission ───────────────────────────────────────────────────────

  private emitAlert(
    cbs: CbsCode,
    origen: EvaluateInput,
    detalle: { descripcion: string; metadata?: Record<string, unknown> },
  ): void {
    const { mitre, nist_csf, severidad } = CBS_CATALOG[cbs];

    const alert: SecurityAlert = {
      id:               generateId(),
      audit_key:        cbs,
      mitre,
      nist_csf,
      severidad,
      descripcion:      detalle.descripcion,
      ip:               origen.ip_origen,
      usuario_id:       origen.usuario_id,
      origen_audit_key: origen.audit_key,
      timestamp:        new Date(),
      metadata:         detalle.metadata,
    };

    // Prometheus counter
    securityAlertsTotal.inc({
      mitre:     alert.mitre,
      nist_csf:  alert.nist_csf,
      severidad: alert.severidad,
    });

    // Persist to MongoDB (fire-and-forget)
    this.alertModel.create({
      id:               alert.id,
      audit_key:        alert.audit_key,
      mitre:            alert.mitre,
      nist_csf:         alert.nist_csf,
      severidad:        alert.severidad,
      descripcion:      alert.descripcion,
      ip:               alert.ip,
      usuario_id:       alert.usuario_id,
      origen_audit_key: alert.origen_audit_key,
      metadata:         alert.metadata,
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
