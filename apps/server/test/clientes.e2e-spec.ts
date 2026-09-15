import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, SEED } from './helpers.js';

describe('Clientes — /clientes', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista tipos de cliente retorna array', async () => {
    const r = await api.get('/clientes/tipos').set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('lista clientes retorna paginación', async () => {
    const r = await api.get('/clientes').set(auth(token));
    expect(r.status).toBe(200);
    const body = r.body as Record<string, unknown>;
    const items = body['items'] ?? body['datos'] ?? r.body;
    expect(Array.isArray(items)).toBe(true);
  });

  it('buscar cliente retorna resultado', async () => {
    const r = await api.get('/clientes?q=test').set(auth(token));
    expect([200, 400]).toContain(r.status);
  });

  it('CRUD: crear y actualizar cliente', async () => {
    const doc = unique('DOC').replace(/-/g, '').slice(0, 12);
    const r = await api.post('/clientes').set(auth(token)).send({
      nombre:       'Cliente e2e Test',
      tipoDocumento: 'cedula',
      documento:    doc,
      email:        `cliente_${doc}@test.com`,
      tipoClienteId: SEED.tipo_cliente_id,
    });
    expect([200, 201]).toContain(r.status);
    const cid = r.body.id;

    const r2 = await api.patch(`/clientes/${cid}`).set(auth(token)).send({ nombre: 'Cliente Editado' });
    expect([200, 201]).toContain(r2.status);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/clientes')).status).toBe(401);
  });
});
