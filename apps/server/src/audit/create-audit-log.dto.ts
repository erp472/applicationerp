import type { TipoTransaccion } from './decorators/audit-key.decorator.js';

export const ACCIONES = [
  'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PRINT', 'EXPORT', 'DENIED',
] as const;

export type AuditAction  = (typeof ACCIONES)[number];
export type AuditResult  = 'OK' | 'ERROR';

export class CreateAuditLogDto {
  usuario_id?:    number;
  accion:         AuditAction;
  entidad:        string;
  entidad_id?:    string | number;
  datos_antes?:   Record<string, unknown>;
  datos_despues?: Record<string, unknown>;
  ip_origen?:     string;
  resultado?:     AuditResult;
  error_msg?:     string;
  audit_key?:     string;
  tipo?:          TipoTransaccion;
}
