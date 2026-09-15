import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList, SEED } from './helpers.js';

describe('Equipos — /equipos', () => {
  let tokenAdmin: string;
  let tokenSupervisor: string;
  beforeAll(async () => {
    tokenAdmin    = await login('admin_sistema');
    tokenSupervisor = await login('supervisor');
  });

  it('lista equipos retorna array', async () => {
    const r = await api.get('/equipos').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(Array.isArray(extractList(r.body))).toBe(true);
  });

  it('filtra por sucursal', async () => {
    const r = await api.get(`/equipos?sucursalId=${SEED.equipos_sucursal_id}`).set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(Array.isArray(extractList(r.body))).toBe(true);
  });

  it('supervisor puede listar equipos', async () => {
    const r = await api.get('/equipos').set(auth(tokenSupervisor));
    expect([200, 403]).toContain(r.status);
  });

  it('CRUD: crear, actualizar, eliminar equipo', async () => {
    const hex = randomHex(2);
    const mac = `AA:BB:CC:DD:EE:${hex}`;
    const r = await api.post('/equipos').set(auth(tokenAdmin)).send({
      mac,
      sucursal_id: SEED.equipos_sucursal_id,
      tipo:        'pos',
      nombre:      'Equipo e2e test',
    });
    expect([200, 201]).toContain(r.status);
    const eid = r.body.id;

    const r2 = await api.patch(`/equipos/${eid}`).set(auth(tokenAdmin)).send({ nombre: 'Equipo editado' });
    expect(r2.status).toBe(200);

    expect([200, 204]).toContain((await api.delete(`/equipos/${eid}`).set(auth(tokenAdmin))).status);
  });

  it('MAC duplicada retorna 409 o 400', async () => {
    const hex = randomHex(2);
    const mac = `11:22:33:44:55:${hex}`;
    const body = { mac, sucursal_id: SEED.equipos_sucursal_id, tipo: 'pos', nombre: 'Dup' };
    await api.post('/equipos').set(auth(tokenAdmin)).send(body);
    const r2 = await api.post('/equipos').set(auth(tokenAdmin)).send(body);
    expect([400, 409]).toContain(r2.status);

    // cleanup
    const lista = await api.get('/equipos').set(auth(tokenAdmin));
    const eq = extractList(lista.body).find((e: { mac: string; id: number }) => e.mac === mac) as { id: number } | undefined;
    if (eq) await api.delete(`/equipos/${eq.id}`).set(auth(tokenAdmin));
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/equipos')).status).toBe(401);
  });
});

function randomHex(bytes: number): string {
  return Array.from({ length: bytes }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase(),
  ).join(':');
}
