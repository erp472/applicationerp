import { SetMetadata } from '@nestjs/common';
import type { AuditAction } from '../create-audit-log.dto.js';

export const AUDIT_KEY_METADATA = 'audit_key';

/** CBS no se usa en @AuditKey: las alertas de ciberseguridad las emite
 *  SecurityRulesService, no un handler HTTP. Se declara aquí porque es un tipo
 *  de transacción de pleno derecho en el catálogo. */
export type TipoTransaccion = 'ADM' | 'OPE' | 'FIN' | 'CBS';

export interface AuditKeyMeta {
  codigo:  string;
  tipo:    TipoTransaccion;
  accion?: AuditAction;
}

/**
 * @AuditKey('ADM-01') — asocia un código de transacción auditable al handler.
 * El tipo se extrae automáticamente del prefijo del código (e.g. 'ADM-01' → tipo='ADM').
 *
 * El segundo argumento fuerza la acción cuando el verbo HTTP no la describe:
 * `POST /auth/login` es un LOGIN, no un CREATE.
 */
export const AuditKey = (codigo: string, accion?: AuditAction) => {
  const prefix = codigo.split('-')[0] as TipoTransaccion;
  const meta: AuditKeyMeta = { codigo, tipo: prefix, ...(accion && { accion }) };
  return SetMetadata(AUDIT_KEY_METADATA, meta);
};
