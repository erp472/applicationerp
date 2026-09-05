import { describe, it, expect } from 'vitest';
import { of, lastValueFrom } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditContextInterceptor } from './audit-context.interceptor.js';
import { auditStore, type AuditStore } from '../audit-context.js';

function contextoCon(req: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

/** Corre el interceptor y devuelve el store que quedó visible para el handler. */
async function storeVisto(req: Record<string, unknown>): Promise<AuditStore | undefined> {
  const interceptor = new AuditContextInterceptor();
  let visto: AuditStore | undefined;
  const next: CallHandler = {
    handle: () => {
      visto = auditStore.getStore();
      return of('ok');
    },
  };
  await lastValueFrom(interceptor.intercept(contextoCon(req), next));
  return visto;
}

describe('AuditContextInterceptor', () => {
  // JwtStrategy.validate devuelve { id, ... }. Leer `sub` dejaba sin usuario a todo
  // lo que audita vía auditStore: los logs de servicio y los cambios de fila.
  it('toma el usuario de user.id, no de user.sub', async () => {
    const store = await storeVisto({ user: { id: 42 }, ip: '1.2.3.4', headers: {} });
    expect(store?.userId).toBe(42);
  });

  it('no inventa usuario en peticiones anónimas como el login', async () => {
    const store = await storeVisto({ ip: '1.2.3.4', headers: {} });
    expect(store?.userId).toBeUndefined();
  });

  it('genera un request_id por petición para correlacionar NIVEL 1 con NIVEL 4', async () => {
    const a = await storeVisto({ user: { id: 1 }, ip: '1.2.3.4', headers: {} });
    const b = await storeVisto({ user: { id: 1 }, ip: '1.2.3.4', headers: {} });
    expect(a?.requestId).toBeTruthy();
    expect(b?.requestId).toBeTruthy();
    expect(a?.requestId).not.toBe(b?.requestId);
  });

  it('cae a x-forwarded-for cuando no hay req.ip', async () => {
    const store = await storeVisto({ user: { id: 1 }, headers: { 'x-forwarded-for': '9.9.9.9' } });
    expect(store?.ip).toBe('9.9.9.9');
  });
});
