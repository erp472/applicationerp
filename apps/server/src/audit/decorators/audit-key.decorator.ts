import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY_METADATA = 'audit_key';

export type TipoTransaccion = 'ADM' | 'OPE' | 'FIN';

export interface AuditKeyMeta {
  codigo: string;
  tipo:   TipoTransaccion;
}

/**
 * @AuditKey('ADM-01') — asocia un código de transacción auditable al handler.
 * El tipo se extrae automáticamente del prefijo del código (e.g. 'ADM-01' → tipo='ADM').
 */
export const AuditKey = (codigo: string) => {
  const prefix = codigo.split('-')[0] as TipoTransaccion;
  const meta: AuditKeyMeta = { codigo, tipo: prefix };
  return SetMetadata(AUDIT_KEY_METADATA, meta);
};
