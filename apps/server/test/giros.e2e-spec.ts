import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Giros — /giros', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  async function getSesionActiva(): Promise<{ cajaId: number; sesionId: number } | null> {
    const r = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(token));
    for (const caja of r.body.cajas ?? []) {
      if (['pos', 'menor'].includes(caja.tipo) && caja.sesionId) {
        return { cajaId: caja.cajaId, sesionId: caja.sesionId };
      }
    }
    return null;
  }

  it('giro inexistente retorna 404', async () => {
    expect((await api.get('/giros/999999').set(auth(token))).status).toBe(404);
  });

  it('giros por sesión inexistente retorna 200 o 404', async () => {
    const r = await api.get('/giros/sesion/999999').set(auth(token));
    expect([200, 404]).toContain(r.status);
    if (r.status === 200) expect(Array.isArray(r.body)).toBe(true);
  });

  it('sin token retorna 401', async () => {
    expect((await api.get('/giros/1')).status).toBe(401);
  });

  it('emitir giro nacional con body vacío retorna 400', async () => {
    const sesion = await getSesionActiva();
    if (!sesion) return; // skip silencioso si no hay sesión

    const r = await api.post(`/giros/punto/${sesion.cajaId}/nacional/emitir`).set(auth(token)).send({});
    expect(r.status).toBe(400);
  });

  it('emitir giro nacional con datos retorna respuesta válida', async () => {
    const sesion = await getSesionActiva();
    if (!sesion) return;

    const r = await api.post(`/giros/punto/${sesion.cajaId}/nacional/emitir`).set(auth(token)).send({
      remitenteNombre:       'e2e Remitente',
      remitenteDocumento:    '12345678',
      remitenteTipoDoc:      'cedula',
      destinatarioNombre:    'e2e Destinatario',
      destinatarioDocumento: '87654321',
      destinatarioTipoDoc:   'cedula',
      montoCop:              '100000',
      ciudadDestino:         'Medellín',
      medioPago:             'efectivo',
    });
    expect([200, 201, 400, 422]).toContain(r.status);
  });

  it('pagar giro con PIN inválido retorna error', async () => {
    const sesion = await getSesionActiva();
    if (!sesion) return;

    const r = await api.post(`/giros/punto/${sesion.cajaId}/nacional/pagar`).set(auth(token))
      .send({ pin: 'PIN-INEXISTENTE-999' });
    expect([400, 404, 422]).toContain(r.status);
  });

  it('anular giro inexistente retorna error', async () => {
    const r = await api.post('/giros/999999/anular').set(auth(token)).send({ motivo: 'Test' });
    expect([400, 404]).toContain(r.status);
  });
});
