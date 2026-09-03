import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEvent, type AuditEventDoc } from './audit-event.schema.js';

@Injectable()
export class MongoAuditService {
  private readonly logger = new Logger(MongoAuditService.name);

  constructor(
    @InjectModel(AuditEvent.name)
    private readonly auditEventModel: Model<AuditEventDoc>,
  ) {}

  /**
   * Fire-and-forget write to MongoDB.
   * NEVER re-throws so the main request flow is never interrupted.
   */
  log(event: Partial<AuditEvent>): void {
    this.auditEventModel.create(event).catch((err: unknown) => {
      this.logger.error(
        `MongoAuditService.log failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  /** Count LOGIN failures from a given IP in the last N minutes (ADM-03 = login endpoint). */
  async countLoginFailures(ip: string, minutos: number): Promise<number> {
    const since = new Date(Date.now() - minutos * 60_000);
    return this.auditEventModel.countDocuments({
      ip,
      audit_key: 'ADM-03',
      resultado: 'ERROR',
      timestamp: { $gte: since },
    });
  }

  /** Count any ERROR events from a given IP in the last N minutes. */
  async countFailuresByIp(ip: string, minutos: number): Promise<number> {
    const since = new Date(Date.now() - minutos * 60_000);
    return this.auditEventModel.countDocuments({
      ip,
      resultado: 'ERROR',
      timestamp: { $gte: since },
    });
  }

  /** Count events for a specific user+action combination in the last N minutes. */
  async countEventsByUser(
    usuarioId: number,
    accion: string,
    minutos: number,
  ): Promise<number> {
    const since = new Date(Date.now() - minutos * 60_000);
    return this.auditEventModel.countDocuments({
      usuario_id: usuarioId,
      accion,
      timestamp:  { $gte: since },
    });
  }

  /** Count DENIED events for a user in the last N minutes. */
  async countDeniedByUser(usuarioId: number, minutos: number): Promise<number> {
    const since = new Date(Date.now() - minutos * 60_000);
    return this.auditEventModel.countDocuments({
      usuario_id: usuarioId,
      accion:     'DENIED',
      timestamp:  { $gte: since },
    });
  }
}
