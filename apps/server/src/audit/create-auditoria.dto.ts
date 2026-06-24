export type AuditAccion = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT';
export type AuditResultado = 'OK' | 'ERROR';

export class CreateAuditoriaDto {
  usuario_id?: string;
  accion: AuditAccion;
  entidad: string;
  entidad_id?: string;
  datos_antes?: Record<string, unknown>;
  datos_despues?: Record<string, unknown>;
  ip_origen?: string;
  resultado?: AuditResultado;
  error_msg?: string;
}
