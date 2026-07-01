import { Injectable } from '@nestjs/common';
import type { operacion_auditoria } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAuditLogDto } from './create-audit-log.dto.js';

const ACCION_TO_OPERACION: Record<string, operacion_auditoria> = {
  CREATE: 'INSERT', LOGIN: 'INSERT', LOGOUT: 'INSERT', PRINT: 'INSERT', EXPORT: 'INSERT', READ: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

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
  }
}
