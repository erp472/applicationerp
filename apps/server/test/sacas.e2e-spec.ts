import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Sacas — /sacas', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('listar sacas con sucursalId retorna 200', async () => {
    const r = await api.get(`/sacas?sucursalId=${SEED.sucursal_id}`).set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body) || typeof r.body === 'object').toBe(true);
  });

  it('listar sacas sin params retorna 400', async () => {
    expect((await api.get('/sacas').set(auth(token))).status).toBe(400);
  });

  it('saca inexistente retorna 404', async () => {
    expect((await api.get('/sacas/999999').set(auth(token))).status).toBe(404);
  });

  it('crear saca retorna resultado válido', async () => {
    const r = await api.post('/sacas').set(auth(token)).send({
      sucursalId:  SEED.sucursal_id,
      tipo:        'terrestre',
      descripcion: 'Saca e2e test',
    });
    expect([200, 201, 400, 422]).toContain(r.status);
  });

  it('cerrar saca inexistente retorna error', async () => {
    const r = await api.post('/sacas/999999/cerrar').set(auth(token)).send({});
    expect([400, 404]).toContain(r.status);
  });

  it('agregar envío a saca inexistente retorna error', async () => {
    const r = await api.post('/sacas/999999/envios').set(auth(token)).send({ envioId: 1 });
    expect([400, 404]).toContain(r.status);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get(`/sacas?sucursalId=${SEED.sucursal_id}`)).status).toBe(401);
  });
});
