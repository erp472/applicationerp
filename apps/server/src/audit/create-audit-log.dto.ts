export type AuditAction  = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT';
export type AuditResult  = 'OK' | 'ERROR';

export class CreateAuditLogDto {
  usuario_id?:    string;
  accion:         AuditAction;
  entidad:        string;
  entidad_id?:    string;
  datos_antes?:   Record<string, unknown>;
  datos_despues?: Record<string, unknown>;
  ip_origen?:     string;
  resultado?:     AuditResult;
  error_msg?:     string;
}
