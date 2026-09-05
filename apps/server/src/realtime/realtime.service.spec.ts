import { describe, it, expect, beforeEach } from 'vitest';
import { RealtimeService, ROL_AUDITORIA } from './realtime.service.js';
import type { WebSocket } from '@fastify/websocket';

const OPEN = 1;

function fakeSocket(readyState = OPEN) {
  const enviados: string[] = [];
  const handlers: Record<string, () => void> = {};
  const ws = {
    OPEN,
    readyState,
    send: (msg: string) => enviados.push(msg),
    on: (evt: string, cb: () => void) => { handlers[evt] = cb; },
    close: () => handlers['close']?.(),
  };
  return { ws: ws as unknown as WebSocket, enviados, cerrar: () => ws.close() };
}

describe('RealtimeService — difusión restringida por rol', () => {
  let service: RealtimeService;

  beforeEach(() => { service = new RealtimeService(); });

  it('no envía auditoría a sockets de otros roles', () => {
    const admin  = fakeSocket();
    const cajero = fakeSocket();
    service.addClient(admin.ws, ROL_AUDITORIA);
    service.addClient(cajero.ws, 'CAJERO');

    service.broadcastToRoles([ROL_AUDITORIA], 'audit.event', { audit_key: 'FIN-01' });

    expect(admin.enviados).toHaveLength(1);
    expect(cajero.enviados).toHaveLength(0);
  });

  it('no envía a sockets sin rol conocido', () => {
    const anonimo = fakeSocket();
    service.addClient(anonimo.ws);
    service.broadcastToRoles([ROL_AUDITORIA], 'audit.event', {});
    expect(anonimo.enviados).toHaveLength(0);
  });

  it('el payload conserva el evento y los datos', () => {
    const admin = fakeSocket();
    service.addClient(admin.ws, ROL_AUDITORIA);
    service.broadcastToRoles([ROL_AUDITORIA], 'audit.event', { audit_key: 'ADM-03' });
    expect(JSON.parse(admin.enviados[0]!)).toEqual({
      event: 'audit.event',
      data:  { audit_key: 'ADM-03' },
    });
  });

  it('broadcast general sigue llegando a todos, con rol o sin él', () => {
    const admin  = fakeSocket();
    const cajero = fakeSocket();
    const anon   = fakeSocket();
    service.addClient(admin.ws, ROL_AUDITORIA);
    service.addClient(cajero.ws, 'CAJERO');
    service.addClient(anon.ws);

    service.broadcast('cajas.movimiento', { id: 1 });

    expect(admin.enviados).toHaveLength(1);
    expect(cajero.enviados).toHaveLength(1);
    expect(anon.enviados).toHaveLength(1);
  });

  it('omite sockets que ya no están abiertos', () => {
    const cerrado = fakeSocket(3);
    service.addClient(cerrado.ws, ROL_AUDITORIA);
    service.broadcastToRoles([ROL_AUDITORIA], 'audit.event', {});
    expect(cerrado.enviados).toHaveLength(0);
  });

  it('descuenta el socket al cerrarse', () => {
    const a = fakeSocket();
    service.addClient(a.ws, ROL_AUDITORIA);
    expect(service.connectionCount).toBe(1);
    a.cerrar();
    expect(service.connectionCount).toBe(0);
  });
});
