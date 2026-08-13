import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList } from './helpers.js';

describe('Servicios — /servicios', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista servicios retorna array no vacío', async () => {
    const r = await api.get('/servicios').set(auth(token));
    expect(r.status).toBe(200);
    expect(extractList(r.body).length).toBeGreaterThan(0);
  });

  it('obtener servicio por id', async () => {
    const lista = await api.get('/servicios?limite=1').set(auth(token));
    const sid = (extractList(lista.body)[0] as { id: number }).id;
    const r = await api.get(`/servicios/${sid}`).set(auth(token));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(sid);
  });

  it('servicio inexistente retorna 404', async () => {
    expect((await api.get('/servicios/999999').set(auth(token))).status).toBe(404);
  });

  it('CRUD: crear, actualizar, eliminar servicio', async () => {
    const codigo = unique('SVC');
    const r = await api.post('/servicios').set(auth(token)).send({
      codigo, nombre: 'Servicio e2e', tipo: 'nacional', activo: true,
    });
    expect([200, 201]).toContain(r.status);
    const sid = r.body.id;

    const r2 = await api.patch(`/servicios/${sid}`).set(auth(token)).send({ nombre: 'Servicio Editado' });
    expect(r2.status).toBe(200);
    expect(r2.body.nombre).toBe('Servicio Editado');

    expect([200, 204]).toContain((await api.delete(`/servicios/${sid}`).set(auth(token))).status);
  });

  it('tarifas de servicio retorna array', async () => {
    const lista = await api.get('/servicios?limite=1').set(auth(token));
    const sid = (extractList(lista.body)[0] as { id: number }).id;
    const r = await api.get(`/servicios/${sid}/tarifas`).set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('sucursales de servicio retorna 200', async () => {
    const lista = await api.get('/servicios?limite=1').set(auth(token));
    const sid = (extractList(lista.body)[0] as { id: number }).id;
    expect((await api.get(`/servicios/${sid}/sucursales`).set(auth(token))).status).toBe(200);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/servicios')).status).toBe(401);
  });
});
