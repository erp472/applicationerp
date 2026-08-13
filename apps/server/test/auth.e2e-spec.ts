import { describe, it, beforeAll, expect } from 'vitest';
import { api, CREDS, login, auth } from './helpers.js';

describe('Auth — /auth/login, /auth/me', () => {
  describe('POST /auth/login', () => {
    it('admin_sistema retorna 201 con token JWT', async () => {
      const r = await api.post('/auth/login').send(CREDS.admin_sistema);
      expect(r.status).toBe(201);
      expect(r.body).toHaveProperty('access_token');
      expect(r.body.usuario.rol).toBe('ADMIN_SISTEMA');
    });

    it('admin_nacional retorna 201', async () => {
      const r = await api.post('/auth/login').send(CREDS.admin_nacional);
      expect(r.status).toBe(201);
      expect(r.body.usuario.rol).toBe('ADMIN_NACIONAL');
    });

    it('supervisor retorna 201', async () => {
      const r = await api.post('/auth/login').send(CREDS.supervisor);
      expect(r.status).toBe(201);
      expect(r.body.usuario.rol).toBe('SUPERVISOR_REGIONAL');
    });

    it('cajero retorna 201', async () => {
      const r = await api.post('/auth/login').send(CREDS.cajero);
      expect(r.status).toBe(201);
      expect(r.body.usuario.rol).toBe('CAJERO');
    });

    it('credenciales inválidas retorna 401', async () => {
      const r = await api.post('/auth/login').send({ email: 'admin@4-72.com.co', password: 'WrongPass!' });
      expect(r.status).toBe(401);
    });

    it('usuario inexistente retorna 401', async () => {
      const r = await api.post('/auth/login').send({ email: 'noexiste@test.com', password: 'cualquiera' });
      expect(r.status).toBe(401);
    });

    it('body vacío retorna 400', async () => {
      const r = await api.post('/auth/login').send({});
      expect(r.status).toBe(400);
    });

    it('email con formato inválido retorna 400 o 401', async () => {
      const r = await api.post('/auth/login').send({ email: 'no-es-email', password: 'Admin472!' });
      expect([400, 401]).toContain(r.status);
    });

    it('contraseña incorrecta para usuario conocido retorna 401', async () => {
      const r = await api.post('/auth/login').send({ email: 'admin.nacional@4-72.com.co', password: 'Admin472!' });
      expect(r.status).toBe(401);
    });

    it('token retornado tiene estructura JWT (3 partes)', async () => {
      const r = await api.post('/auth/login').send(CREDS.admin_sistema);
      expect(r.body.access_token.split('.')).toHaveLength(3);
    });
  });

  describe('GET /auth/me', () => {
    let token: string;
    beforeAll(async () => { token = await login('admin_sistema'); });

    it('retorna usuario autenticado con campos completos', async () => {
      const r = await api.get('/auth/me').set(auth(token));
      expect(r.status).toBe(200);
      expect(r.body.email).toBe(CREDS.admin_sistema.email);
      expect(r.body.rol).toBe('ADMIN_SISTEMA');
      for (const campo of ['id', 'nombre', 'email', 'rol', 'activo', 'permisos']) {
        expect(r.body).toHaveProperty(campo);
      }
    });

    it('permisos son strings no vacíos', async () => {
      const r = await api.get('/auth/me').set(auth(token));
      expect(r.body.permisos.length).toBeGreaterThan(0);
      expect(r.body.permisos.every((p: unknown) => typeof p === 'string')).toBe(true);
    });

    it('sin token retorna 401', async () => {
      expect((await api.get('/auth/me')).status).toBe(401);
    });

    it('token inválido retorna 401', async () => {
      const r = await api.get('/auth/me').set({ Authorization: 'Bearer token_falso' });
      expect(r.status).toBe(401);
    });
  });
});
