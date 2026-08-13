import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList, SEED } from './helpers.js';

describe('Regionales — /regionales', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista regionales retorna array no vacío', async () => {
    const r = await api.get('/regionales').set(auth(token));
    expect(r.status).toBe(200);
    expect(extractList(r.body).length).toBeGreaterThan(0);
  });

  it('obtener regional seed', async () => {
    const r = await api.get(`/regionales/${SEED.regional_id}`).set(auth(token));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(SEED.regional_id);
  });

  it('regional inexistente retorna 404', async () => {
    expect((await api.get('/regionales/999999').set(auth(token))).status).toBe(404);
  });

  it('CRUD: crear, actualizar, eliminar regional', async () => {
    const nombre = unique('Regional Test');
    const r = await api.post('/regionales').set(auth(token)).send({
      nombre,
      comercio_id: SEED.comercio_id,
    });
    expect([200, 201]).toContain(r.status);
    const rid = r.body.id;

    const r2 = await api.patch(`/regionales/${rid}`).set(auth(token)).send({ nombre: unique('Regional Ed') });
    expect(r2.status).toBe(200);

    expect([200, 204]).toContain((await api.delete(`/regionales/${rid}`).set(auth(token))).status);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/regionales')).status).toBe(401);
  });
});
