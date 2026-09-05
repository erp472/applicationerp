import { AsyncLocalStorage } from 'async_hooks';

export interface AuditStore {
  userId?: number;
  ip?: string;
  /** Correlaciona el evento de negocio (NIVEL 1) con los cambios de fila que provocó (NIVEL 4). */
  requestId?: string;
}

export const auditStore = new AsyncLocalStorage<AuditStore>();
