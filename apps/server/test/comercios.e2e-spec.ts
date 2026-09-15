import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList, SEED } from './helpers.js';

describe('Comercios — /comercios', () => {
  let tokenAdmin: string;
  let tokenSupervisor: string;
  beforeAll(async () => {
    tokenAdmin    = await login('admin_sistema');
    tokenSupervisor = await login('supervisor');
  });

  it('lista comercios retorna array con al menos 1', async () => {
    const r = await api.get('/comercios').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(extractList(r.body).length).toBeGreaterThanOrEqual(1);
  });

  it('obtener comercio seed retorna datos correctos', async () => {
    const r = await api.get(`/comercios/${SEED.comercio_id}`).set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(SEED.comercio_id);
    expect(r.body).toHaveProperty('nombre');
  });

  it('comercio inexistente retorna 404', async () => {
    expect((await api.get('/comercios/999999').set(auth(tokenAdmin))).status).toBe(404);
  });

  it('CRUD: crear, leer, actualizar, eliminar comercio', async () => {
    const nombre = unique('Comercio Test');
    const codigo = unique('CO').slice(0, 20);
    const r = await api.post('/comercios').set(auth(tokenAdmin)).send({
      codigo, nombre, nit: '900111222-3', razonSocial: nombre,
    });
    expect([200, 201]).toContain(r.status);
    const cid = r.body.id ?? r.body.datos?.id;

    const r2 = await api.get(`/comercios/${cid}`).set(auth(tokenAdmin));
    expect(r2.status).toBe(200);
    expect(r2.body.nombre).toBe(nombre);

    const nuevoNombre = unique('Comercio Editado');
    const r3 = await api.patch(`/comercios/${cid}`).set(auth(tokenAdmin)).send({ nombre: nuevoNombre });
    expect(r3.status).toBe(200);

    expect([200, 204]).toContain((await api.delete(`/comercios/${cid}`).set(auth(tokenAdmin))).status);
    expect((await api.get(`/comercios/${cid}`).set(auth(tokenAdmin))).status).toBe(404);
  });

  it('sin token retorna 401', async () => {
    expect((await api.post('/comercios').send({ nombre: 'X', nit: '111' })).status).toBe(401);
  });

  it('rol no admin al eliminar retorna 401, 403 o 503', async () => {
    const r = await api.delete(`/comercios/${SEED.comercio_id}`).set(auth(tokenSupervisor));
    expect([401, 403, 503]).toContain(r.status);
  });
});
