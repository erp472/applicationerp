import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Geo — /geo', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista países retorna array no vacío', async () => {
    const r = await api.get('/geo/paises').set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body.length).toBeGreaterThan(0);
  });

  it('Colombia existe en la lista', async () => {
    const r = await api.get('/geo/paises').set(auth(token));
    const colombia = r.body.find((p: { id: number }) => p.id === SEED.pais_id);
    expect(colombia).toBeDefined();
  });

  it('departamentos de Colombia retorna lista', async () => {
    const r = await api.get(`/geo/paises/${SEED.pais_id}/departamentos`).set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body.length).toBeGreaterThan(0);
  });

  it('departamento inválido retorna lista vacía o 404', async () => {
    const r = await api.get('/geo/paises/999999/departamentos').set(auth(token));
    expect([200, 404]).toContain(r.status);
    if (r.status === 200) expect(Array.isArray(r.body)).toBe(true);
  });

  it('ciudades de departamento retorna lista', async () => {
    const deps = await api.get(`/geo/paises/${SEED.pais_id}/departamentos`).set(auth(token));
    const depId = deps.body[0].id;
    const r = await api.get(`/geo/departamentos/${depId}/ciudades`).set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/geo/paises')).status).toBe(401);
  });
});
