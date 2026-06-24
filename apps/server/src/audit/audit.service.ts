import { Injectable } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAuditLogDto } from './create-audit-log.dto.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    const span = trace.getActiveSpan();
    const ctx  = span?.spanContext();

    await this.prisma.auditoria.create({
      data: {
        accion:       dto.accion,
        entidad:      dto.entidad,
        resultado:    dto.resultado ?? 'OK',
        trace_id:     ctx?.traceId ?? null,
        span_id:      ctx?.spanId  ?? null,
        usuario_id:   dto.usuario_id   ?? null,
        entidad_id:   dto.entidad_id   ?? null,
        ip_origen:    dto.ip_origen    ?? null,
        error_msg:    dto.error_msg    ?? null,
        datos_antes:  (dto.datos_antes  ?? null) as object,
        datos_despues:(dto.datos_despues ?? null) as object,
      },
    });
  }
}
