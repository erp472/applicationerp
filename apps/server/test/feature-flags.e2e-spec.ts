import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique } from './helpers.js';

describe('Feature Flags — /feature-flags', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista flags retorna array no vacío', async () => {
    const r = await api.get('/feature-flags').set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body.length).toBeGreaterThan(0);
  });

  it('flags activos para usuario retorna array', async () => {
    const r = await api.get('/feature-flags/activos').set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('flag inexistente retorna 404', async () => {
    expect((await api.get('/feature-flags/999999').set(auth(token))).status).toBe(404);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/feature-flags')).status).toBe(401);
  });

  it('CRUD: crear, leer, actualizar, eliminar flag', async () => {
    const codigo = unique('test_flag').toLowerCase().replace(/-/g, '_');
    const r = await api.post('/feature-flags').set(auth(token)).send({
      codigo, descripcion: 'Flag e2e vitest', activo: true,
    });
    expect([200, 201]).toContain(r.status);
    const fid = r.body.id;

    const r2 = await api.get(`/feature-flags/${fid}`).set(auth(token));
    expect(r2.status).toBe(200);
    expect(r2.body.codigo).toBe(codigo);

    const r3 = await api.patch(`/feature-flags/${fid}`).set(auth(token)).send({ activo: false });
    expect(r3.status).toBe(200);
    expect(r3.body.activo).toBe(false);

    expect([200, 204]).toContain((await api.delete(`/feature-flags/${fid}`).set(auth(token))).status);
  });

  it('agregar y quitar rol de un flag', async () => {
    const codigo = unique('flag_rol').toLowerCase().replace(/-/g, '_');
    const r = await api.post('/feature-flags').set(auth(token)).send({
      codigo, descripcion: 'Flag con rol', activo: true,
    });
    const fid = r.body.id;

    const roles = await api.get('/permisos/roles').set(auth(token));
    const rid = roles.body[0].idroles;

    const r2 = await api.post(`/feature-flags/${fid}/roles`).set(auth(token)).send({ rolId: rid });
    expect([200, 201]).toContain(r2.status);

    const r3 = await api.delete(`/feature-flags/${fid}/roles/${rid}`).set(auth(token));
    expect([200, 204]).toContain(r3.status);

    await api.delete(`/feature-flags/${fid}`).set(auth(token));
  });
});
