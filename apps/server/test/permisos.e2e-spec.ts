import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique } from './helpers.js';

describe('Permisos — /permisos', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  describe('Roles', () => {
    it('lista roles retorna array no vacío', async () => {
      const r = await api.get('/permisos/roles').set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
      expect(r.body.length).toBeGreaterThan(0);
    });

    it('primer rol tiene campo idroles', async () => {
      const r = await api.get('/permisos/roles').set(auth(token));
      expect(r.body[0]).toHaveProperty('idroles');
    });

    it('permisos de un rol retorna array', async () => {
      const roles = await api.get('/permisos/roles').set(auth(token));
      const rid = roles.body[0].idroles;
      const r = await api.get(`/permisos/roles/${rid}/permisos`).set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    });

    it('matrix de permisos retorna 200', async () => {
      const r = await api.get('/permisos/matrix').set(auth(token));
      expect(r.status).toBe(200);
    });

    it('sin token retorna 401', async () => {
      expect((await api.get('/permisos/roles')).status).toBe(401);
    });
  });

  describe('CRUD Permisos', () => {
    it('lista permisos retorna array', async () => {
      const r = await api.get('/permisos/permisos').set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    });

    it('estructura de permiso tiene campos raw Prisma', async () => {
      const r = await api.get('/permisos/permisos').set(auth(token));
      if (r.body.length > 0) {
        const p = r.body[0];
        expect(p).toHaveProperty('idpermisos');
        expect(p).toHaveProperty('codigopermisos');
        expect(p).toHaveProperty('modulopermisos');
      }
    });

    it('crear, actualizar y eliminar permiso', async () => {
      const codigo = unique('perm').toUpperCase().replace('-', '_');
      const r = await api.post('/permisos/permisos').set(auth(token)).send({
        codigopermisos:      codigo,
        descripcionpermisos: 'Permiso pytest',
        modulopermisos:      'test',
      });
      expect([200, 201]).toContain(r.status);
      const pid = r.body.idpermisos ?? r.body.id;

      const r2 = await api.delete(`/permisos/permisos/${pid}`).set(auth(token));
      expect([200, 204]).toContain(r2.status);
    });
  });
});
