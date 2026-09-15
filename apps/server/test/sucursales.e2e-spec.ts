import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList, SEED } from './helpers.js';

describe('Sucursales — /sucursales', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista sucursales retorna array no vacío', async () => {
    const r = await api.get('/sucursales').set(auth(token));
    expect(r.status).toBe(200);
    expect(extractList(r.body).length).toBeGreaterThan(0);
  });

  it('paginación funciona', async () => {
    const r = await api.get('/sucursales?pagina=1&limite=5').set(auth(token));
    expect(r.status).toBe(200);
  });

  it('obtener sucursal seed', async () => {
    const r = await api.get(`/sucursales/${SEED.sucursal_id}`).set(auth(token));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(SEED.sucursal_id);
  });

  it('sucursal inexistente retorna 404', async () => {
    expect((await api.get('/sucursales/999999').set(auth(token))).status).toBe(404);
  });

  it('CRUD: crear, actualizar, eliminar sucursal', async () => {
    const nombre = unique('Sucursal Test');
    const r = await api.post('/sucursales').set(auth(token)).send({
      nombre,
      regional_id:  SEED.regional_id,
      ciudad:       'Bogotá',
      direccion:    'Cra 7 # 1-01',
    });
    expect([200, 201]).toContain(r.status);
    const sid = r.body.id;

    const r2 = await api.patch(`/sucursales/${sid}`).set(auth(token)).send({ nombre: unique('Sucursal Ed') });
    expect(r2.status).toBe(200);

    expect([200, 204]).toContain((await api.delete(`/sucursales/${sid}`).set(auth(token))).status);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/sucursales')).status).toBe(401);
  });
});
