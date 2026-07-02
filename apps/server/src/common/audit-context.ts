import { AsyncLocalStorage } from 'async_hooks';

export interface AuditStore {
  userId?: number;
  ip?: string;
}

export const auditStore = new AsyncLocalStorage<AuditStore>();
