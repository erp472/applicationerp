import { Injectable, Optional, Inject } from '@nestjs/common';
import * as promClient from 'prom-client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ACCIONES, CreateAuditLogDto, type AuditAction } from './create-audit-log.dto.js';
import { MongoAuditService, type AuditEventPlano } from './mongo/mongo-audit.service.js';
import { redact } from './mongo/redact.js';
import { auditStore } from '../common/audit-context.js';
import { RealtimeService, ROL_AUDITORIA } from '../realtime/realtime.service.js';

export type Operacion = 'INSERT' | 'UPDATE' | 'DELETE';

const ACCION_TO_OPERACION: Record<string, Operacion> = {
  CREATE: 'INSERT', LOGIN: 'INSERT', LOGOUT: 'INSERT', PRINT: 'INSERT', EXPORT: 'INSERT', READ: 'INSERT', DENIED: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

/** Mongo guarda la acción, no la operación de tabla; el filtro por operación se
 *  traduce a las acciones que le corresponden. */
const OPERACION_TO_ACCIONES: Record<Operacion, readonly string[]> = {
  INSERT: ACCIONES.filter((a) => ACCION_TO_OPERACION[a] === 'INSERT'),
  UPDATE: ['UPDATE'],
  DELETE: ['DELETE'],
};

/** Evento sin `audit_key` significa que un punto de registro se quedó sin código:
 *  se guarda igual y queda visible en el panel en vez de perderse. */
const SIN_CLAVE = 'SIN-CLAVE';

const CSV_HEADER = [
  'Fecha/Hora', 'Código', 'Categoría', 'Acción', 'Tabla', 'Registro',
  'Usuario', 'Email', 'IP', 'Resultado', 'Error',
] as const;

const LOTE_EXPORT = 1000;

interface UsuarioPlano {
  id:     number;
  nombre: string;
  email:  string;
}

function escaparCsv(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

const auditEventsTotal = new promClient.Counter({
  name:       'pos472_audit_events_total',
  help:       'Total audit events logged',
  labelNames: ['audit_key', 'tipo', 'resultado'],
});

export interface AuditFindParams {
  tabla?:     string;
  operacion?: Operacion;
  accion?:    string;
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
    private readonly mongoAudit: MongoAuditService,
    @Optional() @Inject(RealtimeService)
    private readonly realtime: RealtimeService | null,
  ) {}

  // Sigue siendo async aunque ya no espere a nadie: los 25 puntos de registro la
  // encadenan con `await` o `void`.
  async log(dto: CreateAuditLogDto): Promise<void> {
    const despues: Record<string, unknown> = {
      accion: dto.accion,
      ...(dto.resultado && { resultado: dto.resultado }),
      ...(dto.error_msg && { error: dto.error_msg }),
      ...(dto.datos_despues ?? {}),
    };

    const evento = {
      audit_key:       dto.audit_key ?? SIN_CLAVE,
      tipo:            dto.tipo ?? 'OPE',
      accion:          dto.accion,
      entidad:         dto.entidad,
      entidad_id:      dto.entidad_id !== undefined ? String(dto.entidad_id) : undefined,
      usuario_id:      dto.usuario_id,
      ip:              dto.ip_origen,
      payload_antes:   redact(dto.datos_antes) as unknown,
      payload_despues: redact(despues) as unknown,
      resultado:       dto.resultado,
      error_msg:       dto.error_msg,
      request_id:      auditStore.getStore()?.requestId,
    };

    auditEventsTotal.inc({
      audit_key: evento.audit_key,
      tipo:      evento.tipo,
      resultado: dto.resultado ?? 'OK',
    });

    this.mongoAudit.log(evento);

    // Solo NIVEL 1 y solo al superadmin: el payload lleva montos, clientes y
    // documentos de todas las sucursales.
    this.realtime?.broadcastToRoles([ROL_AUDITORIA], 'audit.event', {
      ...evento,
      timestamp: new Date().toISOString(),
    });
  }

  async findAll(params: AuditFindParams) {
    const { tabla, operacion, accion, usuarioId, desde, hasta, pagina, limite } = params;

    // `accion` es más específica que `operacion`, así que si vienen las dos manda ella.
    const acciones = accion
      ? [accion]
      : operacion
        ? OPERACION_TO_ACCIONES[operacion]
        : undefined;

    const { total, datos } = await this.mongoAudit.find({
      entidad: tabla,
      acciones,
      usuarioId,
      desde,
      hasta,
      pagina,
      limite,
    });

    const usuarios = await this.usuariosDe(datos);

    return {
      datos: datos.map((e) => ({
        id:           String(e._id),
        auditKey:     e.audit_key,
        tipo:         e.tipo,
        tabla:        e.entidad ?? '',
        operacion:    ACCION_TO_OPERACION[e.accion ?? ''] ?? 'INSERT',
        accion:       (e.accion ?? 'READ') as AuditAction,
        registroId:   e.entidad_id ?? null,
        datosAntes:   (e.payload_antes ?? null) as Record<string, unknown> | null,
        datosDespues: (e.payload_despues ?? null) as Record<string, unknown> | null,
        ipOrigen:     e.ip ?? null,
        resultado:    e.resultado ?? null,
        errorMsg:     e.error_msg ?? null,
        requestId:    e.request_id ?? null,
        createdAt:    e.timestamp.toISOString(),
        usuario:      (e.usuario_id !== undefined && usuarios.get(e.usuario_id)) || null,
      })),
      meta: {
        total,
        pagina,
        limite,
        paginas: Math.ceil(total / limite),
      },
    };
  }

  /** Mongo solo guarda `usuario_id`; el nombre y el correo viven en PostgreSQL. */
  private async usuariosDe(eventos: { usuario_id?: number }[]) {
    const ids = [...new Set(eventos.flatMap((e) => (e.usuario_id !== undefined ? [e.usuario_id] : [])))];
    if (ids.length === 0) return new Map<number, { id: number; nombre: string; email: string }>();

    const filas = await this.prisma.usuario.findMany({
      where:  { idusuarios: { in: ids } },
      select: { idusuarios: true, nombreusuarios: true, emailusuarios: true },
    });

    return new Map(
      filas.map((u) => [u.idusuarios, { id: u.idusuarios, nombre: u.nombreusuarios, email: u.emailusuarios }]),
    );
  }

  /** Emite el CSV por lotes en vez de materializar la consulta entera: una
   *  exportación sin filtros puede ser de millones de eventos. */
  async *exportCsv(params: Omit<AuditFindParams, 'pagina' | 'limite'>): AsyncGenerator<string> {
    const { tabla, accion, usuarioId, desde, hasta } = params;

    // BOM UTF-8 para que Excel abra correctamente caracteres especiales
    yield '﻿' + CSV_HEADER.join(',') + '\r\n';

    const usuarios = new Map<number, UsuarioPlano | null>();
    const cursor = this.mongoAudit.cursor(
      { entidad: tabla, acciones: accion ? [accion] : undefined, usuarioId, desde, hasta },
      LOTE_EXPORT,
    );

    let lote: AuditEventPlano[] = [];
    try {
      for await (const evento of cursor) {
        lote.push(evento);
        if (lote.length === LOTE_EXPORT) {
          yield await this.loteCsv(lote, usuarios);
          lote = [];
        }
      }
      if (lote.length > 0) yield await this.loteCsv(lote, usuarios);
    } finally {
      await cursor.close();
    }
  }

  /** `usuarios` se comparte entre lotes para no repetir la consulta a PostgreSQL
   *  por cada aparición del mismo usuario. */
  private async loteCsv(
    lote: AuditEventPlano[],
    usuarios: Map<number, UsuarioPlano | null>,
  ): Promise<string> {
    const nuevos = [
      ...new Set(
        lote.flatMap((e) =>
          e.usuario_id !== undefined && !usuarios.has(e.usuario_id) ? [e.usuario_id] : [],
        ),
      ),
    ];

    if (nuevos.length > 0) {
      const encontrados = await this.usuariosDe(nuevos.map((id) => ({ usuario_id: id })));
      // El ausente también se cachea: si el usuario ya no existe, no vale reconsultarlo.
      for (const id of nuevos) usuarios.set(id, encontrados.get(id) ?? null);
    }

    return (
      lote
        .map((e) => {
          const u = e.usuario_id !== undefined ? usuarios.get(e.usuario_id) : undefined;
          return [
            e.timestamp.toISOString(),
            e.audit_key,
            e.tipo,
            e.accion,
            e.entidad,
            e.entidad_id,
            u?.nombre,
            u?.email,
            e.ip,
            e.resultado,
            e.error_msg,
          ]
            .map(escaparCsv)
            .join(',');
        })
        .join('\r\n') + '\r\n'
    );
  }

  async statsHoy() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const { porAccion, errores } = await this.mongoAudit.statsDesde(inicio);

    const porOperacion: Record<Operacion, number> = { INSERT: 0, UPDATE: 0, DELETE: 0 };
    let total = 0;
    for (const [acc, n] of Object.entries(porAccion)) {
      total += n;
      porOperacion[ACCION_TO_OPERACION[acc] ?? 'INSERT'] += n;
    }

    return {
      total,
      inserciones:     porOperacion.INSERT,
      actualizaciones: porOperacion.UPDATE,
      eliminaciones:   porOperacion.DELETE,
      errores,
    };
  }
}
