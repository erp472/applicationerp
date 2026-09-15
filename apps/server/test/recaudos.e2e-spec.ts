import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Recaudos — /recaudos', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('convenios con sucursal retorna 200 o 400', async () => {
    const r = await api.get(`/recaudos/convenios?sucursalId=${SEED.caja_sucursal_id}`).set(auth(token));
    expect([200, 400]).toContain(r.status);
    if (r.status === 200) expect(typeof r.body === 'object' || Array.isArray(r.body)).toBe(true);
  });

  it('recaudos por sesión inexistente retorna 200 o 404', async () => {
    const r = await api.get('/recaudos/sesion/999999').set(auth(token));
    expect([200, 404]).toContain(r.status);
    if (r.status === 200) expect(Array.isArray(r.body)).toBe(true);
  });

  it('recaudo inexistente retorna 404', async () => {
    expect((await api.get('/recaudos/999999').set(auth(token))).status).toBe(404);
  });

  it('registrar recaudo en caja inexistente retorna error', async () => {
    const r = await api.post('/recaudos/punto/999999/registrar').set(auth(token)).send({
      convenioId: 1, referencia: 'REF-E2E-001', valor: '50000',
    });
    expect([400, 404, 422]).toContain(r.status);
  });

  it('anular recaudo inexistente retorna error', async () => {
    const r = await api.post('/recaudos/999999/anular').set(auth(token)).send({ motivo: 'Test anulación' });
    expect([400, 404]).toContain(r.status);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/recaudos/sesion/1')).status).toBe(401);
  });

  it('flujo registrar recaudo (si hay sesión y convenios)', async () => {
    const status = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(token));
    let cajaId: number | null = null;
    for (const caja of status.body.cajas ?? []) {
      if (['pos', 'menor'].includes(caja.tipo) && caja.sesionId) { cajaId = caja.cajaId; break; }
    }
    if (!cajaId) return; // sin sesión activa

    const conv = await api.get(`/recaudos/convenios?sucursalId=${SEED.caja_sucursal_id}`).set(auth(token));
    if (conv.status !== 200 || !conv.body.length) return; // sin convenios

    const convenioId = conv.body[0].id ?? conv.body[0].convenioId;
    const r = await api.post(`/recaudos/punto/${cajaId}/registrar`).set(auth(token)).send({
      convenioId, referencia: `REF-E2E-${cajaId}`, valor: '30000', medioPago: 'efectivo',
    });
    expect([200, 201, 400, 422]).toContain(r.status);
  });
});
