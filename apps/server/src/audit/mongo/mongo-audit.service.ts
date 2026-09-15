import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEvent, type AuditEventDoc } from './audit-event.schema.js';

export interface AuditFiltro {
  entidad?:  string;
  acciones?: readonly string[];
  usuarioId?: number;
  desde?:    Date;
  hasta?:    Date;
}

export interface AuditQuery extends AuditFiltro {
  pagina:    number;
  limite:    number;
}

export interface AuditEventPlano extends AuditEvent {
  _id: unknown;
}

/** El filtro por tabla es una subcadena escrita por el usuario; sin escapar,
 *  un `(` o un `*` la convierte en una regex arbitraria contra la colección. */
function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  private construirFiltro(q: AuditFiltro): Record<string, unknown> {
    return {
      ...(q.entidad   && { entidad: { $regex: escaparRegex(q.entidad), $options: 'i' } }),
      ...(q.acciones  && { accion: { $in: [...q.acciones] } }),
      ...(q.usuarioId && { usuario_id: q.usuarioId }),
      ...((q.desde || q.hasta) && {
        timestamp: {
          ...(q.desde && { $gte: q.desde }),
          ...(q.hasta && { $lte: q.hasta }),
        },
      }),
    };
  }

  /** Página de eventos ordenada del más reciente al más antiguo. */
  async find(q: AuditQuery): Promise<{ total: number; datos: AuditEventPlano[] }> {
    const filtro = this.construirFiltro(q);

    const [total, datos] = await Promise.all([
      this.auditEventModel.countDocuments(filtro),
      this.auditEventModel
        .find(filtro)
        .sort({ timestamp: -1 })
        .skip((q.pagina - 1) * q.limite)
        .limit(q.limite)
        .lean<AuditEventPlano[]>(),
    ]);

    return { total, datos };
  }

  /** Recorre todos los eventos que coincidan sin paginar, para exportaciones que
   *  no caben en memoria. El consumidor debe iterarlo hasta el final o cerrarlo. */
  cursor(q: AuditFiltro, lote = 1000) {
    return this.auditEventModel
      .find(this.construirFiltro(q))
      .sort({ timestamp: -1 })
      .batchSize(lote)
      .lean<AuditEventPlano>()
      .cursor();
  }

  /** Conteo por acción y total de errores desde una fecha, en una sola pasada por rama. */
  async statsDesde(desde: Date): Promise<{ porAccion: Record<string, number>; errores: number }> {
    const [grupos, errores] = await Promise.all([
      this.auditEventModel.aggregate<{ _id: string | null; n: number }>([
        { $match: { timestamp: { $gte: desde } } },
        { $group: { _id: '$accion', n: { $sum: 1 } } },
      ]),
      this.auditEventModel.countDocuments({ timestamp: { $gte: desde }, resultado: 'ERROR' }),
    ]);

    const porAccion = Object.fromEntries(
      grupos.map((g) => [g._id ?? 'DESCONOCIDA', g.n]),
    );

    return { porAccion, errores };
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
