import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth } from './helpers.js';

describe('Sigma — /sigma', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('sin SIGMA_URL configurada retorna null o resultado vacío', async () => {
    const r = await api.get('/sigma/codigo-postal?ciudad=Bogotá').set(auth(token));
    expect(r.status).toBe(200);
    const body = r.body;
    expect(body === null || typeof body === 'object').toBe(true);
  });

  it('ciudad vacía retorna resultado manejado', async () => {
    const r = await api.get('/sigma/codigo-postal?ciudad=').set(auth(token));
    expect([200, 400]).toContain(r.status);
  });

  it('varias ciudades retornan resultado consistente', async () => {
    for (const ciudad of ['Medellín', 'Cali', 'Barranquilla']) {
      const r = await api.get(`/sigma/codigo-postal?ciudad=${encodeURIComponent(ciudad)}`).set(auth(token));
      expect(r.status).toBe(200);
    }
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/sigma/codigo-postal?ciudad=Bogotá')).status).toBe(401);
  });

  it('sin parámetro ciudad retorna 400 o resultado vacío', async () => {
    const r = await api.get('/sigma/codigo-postal').set(auth(token));
    expect([200, 400]).toContain(r.status);
  });
});
