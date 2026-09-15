import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, unique, extractList } from './helpers.js';

describe('Productos — /productos, /admin/estampillas', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('lista productos retorna array no vacío', async () => {
    const r = await api.get('/productos').set(auth(token));
    expect(r.status).toBe(200);
    expect(extractList(r.body).length).toBeGreaterThan(0);
  });

  it('paginación funciona', async () => {
    const r = await api.get('/productos?pagina=1&limite=5').set(auth(token));
    expect(r.status).toBe(200);
  });

  it('obtener producto por id', async () => {
    const lista = await api.get('/productos?limite=1').set(auth(token));
    const pid = extractList(lista.body)[0] as { id: number };
    const r = await api.get(`/productos/${pid.id}`).set(auth(token));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(pid.id);
  });

  it('producto inexistente retorna 404', async () => {
    expect((await api.get('/productos/999999').set(auth(token))).status).toBe(404);
  });

  it('CRUD: crear, actualizar, eliminar producto', async () => {
    const codigo = unique('PROD');
    const r = await api.post('/productos').set(auth(token)).send({
      codigo, nombre: 'Producto e2e', tipo: 'estampilla', precio: 1000, activo: true,
    });
    expect([200, 201]).toContain(r.status);
    const pid = r.body.id;

    const lista = await api.get(`/productos/${pid}`).set(auth(token));
    expect(lista.body.codigo).toBe(codigo);

    const r2 = await api.patch(`/productos/${pid}`).set(auth(token)).send({ nombre: 'Producto Editado' });
    expect(r2.status).toBe(200);
    expect(r2.body.nombre).toBe('Producto Editado');

    expect([200, 204]).toContain((await api.delete(`/productos/${pid}`).set(auth(token))).status);
  });

  it('sucursales asignadas a producto retorna 200', async () => {
    const lista = await api.get('/productos?limite=1').set(auth(token));
    const pid = (extractList(lista.body)[0] as { id: number }).id;
    const r = await api.get(`/productos/${pid}/sucursales`).set(auth(token));
    expect(r.status).toBe(200);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/productos')).status).toBe(401);
  });

  it('lista estampillas retorna 200', async () => {
    expect((await api.get('/admin/estampillas').set(auth(token))).status).toBe(200);
  });

  it('lista productos especiales retorna 200', async () => {
    expect((await api.get('/admin/productos-especiales').set(auth(token))).status).toBe(200);
  });
});
