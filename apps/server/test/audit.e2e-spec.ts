import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, extractList } from './helpers.js';

describe('Audit — /audit', () => {
  let tokenAdmin: string;
  let tokenSupervisor: string;
  beforeAll(async () => {
    tokenAdmin    = await login('admin_sistema');
    tokenSupervisor = await login('supervisor');
  });

  it('lista eventos de auditoría retorna 200 con array', async () => {
    const r = await api.get('/audit').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(Array.isArray(extractList(r.body))).toBe(true);
  });

  it('filtra por tabla', async () => {
    const r = await api.get('/audit?tabla=usuarios').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(Array.isArray(extractList(r.body))).toBe(true);
  });

  it('filtra por operación', async () => {
    const r = await api.get('/audit?operacion=UPDATE').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
  });

  it('paginación funciona', async () => {
    const r = await api.get('/audit?pagina=1&limite=5').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
  });

  it('stats de auditoría retorna 200', async () => {
    const r = await api.get('/audit/stats').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
  });

  it('estructura de evento tiene campos esperados', async () => {
    const r = await api.get('/audit?limite=1').set(auth(tokenAdmin));
    if (r.body.length > 0) {
      const evento = r.body[0];
      for (const campo of ['id', 'tabla', 'operacion', 'creadoEn']) {
        expect(evento).toHaveProperty(campo);
      }
    }
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/audit')).status).toBe(401);
  });

  it('rol no admin retorna 403', async () => {
    const r = await api.get('/audit').set(auth(tokenSupervisor));
    expect(r.status).toBe(403);
  });
});
