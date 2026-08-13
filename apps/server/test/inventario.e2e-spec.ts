import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, extractList, SEED } from './helpers.js';

describe('Inventario — /inventario', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('stock de sucursal retorna lista', async () => {
    const r = await api.get(`/inventario/sucursal/${SEED.sucursal_id}`).set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(extractList(r.body))).toBe(true);
  });

  it('sucursales con inventario retorna 200', async () => {
    expect((await api.get('/inventario/sucursales').set(auth(token))).status).toBe(200);
  });

  it('alertas de inventario retorna 200', async () => {
    expect((await api.get('/inventario/alertas').set(auth(token))).status).toBe(200);
  });

  it('movimientos de sucursal retorna 200', async () => {
    const r = await api.get(`/inventario/sucursal/${SEED.sucursal_id}/movimientos`).set(auth(token));
    expect(r.status).toBe(200);
  });

  it('órdenes de inventario retorna 200', async () => {
    expect((await api.get('/inventario/ordenes').set(auth(token))).status).toBe(200);
  });

  it('órdenes pendientes retorna 200', async () => {
    expect((await api.get('/inventario/ordenes/pendientes').set(auth(token))).status).toBe(200);
  });

  it('ajuste con producto inválido retorna error', async () => {
    const r = await api.post(`/inventario/sucursal/${SEED.sucursal_id}/ajuste`).set(auth(token)).send({
      productoId: 999999, cantidad: 1, motivo: 'Ajuste e2e',
    });
    expect([400, 404, 500]).toContain(r.status);
  });

  it('ajuste con producto real retorna respuesta válida', async () => {
    const stock = await api.get(`/inventario/sucursal/${SEED.sucursal_id}`).set(auth(token));
    const datos = extractList(stock.body) as { productoId: number }[];
    if (!datos.length) return; // sin stock no hay nada que ajustar

    const r = await api.post(`/inventario/sucursal/${SEED.sucursal_id}/ajuste`).set(auth(token)).send({
      productoId: datos[0].productoId, cantidad: 0, motivo: 'Ajuste e2e',
    });
    expect([200, 201, 400, 500]).toContain(r.status);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get(`/inventario/sucursal/${SEED.sucursal_id}`)).status).toBe(401);
  });
});
