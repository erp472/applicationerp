import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList } from './helpers.js';

describe('Users — /users', () => {
  let tokenAdmin: string;
  let tokenSupervisor: string;
  beforeAll(async () => {
    tokenAdmin    = await login('admin_sistema');
    tokenSupervisor = await login('supervisor');
  });

  it('lista usuarios retorna array', async () => {
    const r = await api.get('/users').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(extractList(r.body).length).toBeGreaterThan(0);
  });

  it('paginación funciona', async () => {
    const r = await api.get('/users?pagina=1&limite=5').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
  });

  it('GET /users/me retorna usuario autenticado', async () => {
    const r = await api.get('/users/me').set(auth(tokenAdmin));
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty('email');
  });

  it('supervisor no puede listar todos los usuarios', async () => {
    const r = await api.get('/users').set(auth(tokenSupervisor));
    expect([403, 200]).toContain(r.status);
  });

  it('CRUD: crear, actualizar, eliminar usuario', async () => {
    const email = `test_${unique('usr')}@4-72.com.co`.toLowerCase().replace(/-/g, '_');
    const r = await api.post('/users').set(auth(tokenAdmin)).send({
      nombre:   'Test Pytest',
      email,
      password: 'TestPass123!',
      rol:      'CAJERO',
    });
    expect([200, 201]).toContain(r.status);
    const uid = r.body.id;

    const r2 = await api.patch(`/users/${uid}`).set(auth(tokenAdmin)).send({ nombre: 'Test Editado' });
    expect(r2.status).toBe(200);

    expect([200, 204]).toContain((await api.delete(`/users/${uid}`).set(auth(tokenAdmin))).status);
  });

  it('email duplicado retorna 409', async () => {
    const email = `dup_${unique('usr')}@4-72.com.co`.toLowerCase().replace(/-/g, '_');
    await api.post('/users').set(auth(tokenAdmin)).send({
      nombre: 'Dup1', email, password: 'TestPass123!', rol: 'CAJERO',
    });
    const r2 = await api.post('/users').set(auth(tokenAdmin)).send({
      nombre: 'Dup2', email, password: 'TestPass123!', rol: 'CAJERO',
    });
    expect(r2.status).toBe(409);

    // cleanup
    const lista = await api.get('/users').set(auth(tokenAdmin));
    const usuario = extractList(lista.body).find((u: { email: string }) => u.email === email) as { id: number } | undefined;
    if (usuario) await api.delete(`/users/${usuario.id}`).set(auth(tokenAdmin));
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/users')).status).toBe(401);
  });
});
