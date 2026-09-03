import { Injectable, Optional, Inject } from '@nestjs/common';
import * as promClient from 'prom-client';
import type { operacion_auditoria } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAuditLogDto } from './create-audit-log.dto.js';
import { MongoAuditService } from './mongo/mongo-audit.service.js';

const ACCION_TO_OPERACION: Record<string, operacion_auditoria> = {
  CREATE: 'INSERT', LOGIN: 'INSERT', LOGOUT: 'INSERT', PRINT: 'INSERT', EXPORT: 'INSERT', READ: 'INSERT', DENIED: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

const auditEventsTotal = new promClient.Counter({
  name:       'pos472_audit_events_total',
  help:       'Total audit events logged',
  labelNames: ['audit_key', 'tipo', 'resultado'],
});

export interface AuditFindParams {
  tabla?:     string;
  operacion?: operacion_auditoria;
  usuarioId?: number;
  desde?:     Date;
  hasta?:     Date;
  pagina:     number;
  limite:     number;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(MongoAuditService)
    private readonly mongoAudit: MongoAuditService | null,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    const operacion = ACCION_TO_OPERACION[dto.accion] ?? 'INSERT';
    const registroId = typeof dto.entidad_id === 'number'
      ? dto.entidad_id
      : parseInt(String(dto.entidad_id ?? '0'), 10) || 0;

    const despues: Record<string, unknown> = {
      accion: dto.accion,
      ...(dto.resultado && { resultado: dto.resultado }),
      ...(dto.error_msg && { error: dto.error_msg }),
      ...(dto.datos_despues ?? {}),
    };

    await this.prisma.eventoAuditoria.create({
      data: {
        tablaeventos_auditoria:         dto.entidad,
        operacioneventos_auditoria:     operacion,
        registro_ideventos_auditoria:   registroId,
        usuarios_idusuarios:            dto.usuario_id ?? null,
        ip_origeneventos_auditoria:     dto.ip_origen ?? null,
        datos_anteseventos_auditoria:   (dto.datos_antes ?? null) as object,
        datos_despueseventos_auditoria: despues as object,
      },
    });

    // Prometheus counter
    if (dto.audit_key) {
      auditEventsTotal.inc({
        audit_key: dto.audit_key,
        tipo:      dto.tipo ?? 'OPE',
        resultado: dto.resultado ?? 'OK',
      });
    }

    // Fire-and-forget dual-write to MongoDB
    if (this.mongoAudit && dto.audit_key) {
      this.mongoAudit.log({
        audit_key:       dto.audit_key,
        tipo:            dto.tipo ?? 'OPE',
        accion:          dto.accion,
        entidad:         dto.entidad,
        entidad_id:      dto.entidad_id !== undefined ? String(dto.entidad_id) : undefined,
        usuario_id:      dto.usuario_id,
        ip:              dto.ip_origen,
        payload_antes:   dto.datos_antes,
        payload_despues: despues,
        resultado:       dto.resultado,
        error_msg:       dto.error_msg,
      });
    }
  }

  async findAll(params: AuditFindParams) {
    const { tabla, operacion, usuarioId, desde, hasta, pagina, limite } = params;

    const where = {
      ...(tabla      && { tablaeventos_auditoria: { contains: tabla, mode: 'insensitive' as const } }),
      ...(operacion  && { operacioneventos_auditoria: operacion }),
      ...(usuarioId  && { usuarios_idusuarios: usuarioId }),
      ...((desde || hasta) && {
        created_ateventos_auditoria: {
          ...(desde && { gte: desde }),
          ...(hasta && { lte: new Date(hasta.getTime() + 86_400_000) }),
        },
      }),
    };

    const [total, datos] = await Promise.all([
      this.prisma.eventoAuditoria.count({ where }),
      this.prisma.eventoAuditoria.findMany({
        where,
        orderBy: { created_ateventos_auditoria: 'desc' },
        skip:    (pagina - 1) * limite,
        take:    limite,
        include: {
          usuario: {
            select: { idusuarios: true, nombreusuarios: true, emailusuarios: true },
          },
        },
      }),
    ]);

    return {
      datos: datos.map((e) => ({
        id:           e.ideventos_auditoria,
        tabla:        e.tablaeventos_auditoria,
        operacion:    e.operacioneventos_auditoria,
        registroId:   e.registro_ideventos_auditoria,
        datosAntes:   e.datos_anteseventos_auditoria,
        datosDespues: e.datos_despueseventos_auditoria,
        ipOrigen:     e.ip_origeneventos_auditoria,
        macOrigen:    e.mac_origeneventos_auditoria,
        createdAt:    e.created_ateventos_auditoria.toISOString(),
        usuario:      e.usuario
          ? { id: e.usuario.idusuarios, nombre: e.usuario.nombreusuarios, email: e.usuario.emailusuarios }
          : null,
      })),
      meta: {
        total,
        pagina,
        limite,
        paginas: Math.ceil(total / limite),
      },
    };
  }

  async statsHoy() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const [total, porOperacion, errores] = await Promise.all([
      this.prisma.eventoAuditoria.count({
        where: { created_ateventos_auditoria: { gte: inicio } },
      }),
      this.prisma.eventoAuditoria.groupBy({
        by: ['operacioneventos_auditoria'],
        where: { created_ateventos_auditoria: { gte: inicio } },
        _count: true,
      }),
      this.prisma.eventoAuditoria.count({
        where: {
          created_ateventos_auditoria: { gte: inicio },
          datos_despueseventos_auditoria: { path: ['resultado'], equals: 'ERROR' },
        },
      }),
    ]);

    const counts = Object.fromEntries(
      porOperacion.map((r) => [r.operacioneventos_auditoria, r._count]),
    );

    return {
      total,
      inserciones:     counts['INSERT'] ?? 0,
      actualizaciones: counts['UPDATE'] ?? 0,
      eliminaciones:   counts['DELETE'] ?? 0,
      errores,
    };
  }
}
