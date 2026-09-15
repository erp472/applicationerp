import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Devices — /devices', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  it('heartbeat sin autenticación retorna 200', async () => {
    const r = await api.post('/devices/heartbeat').send({ mac_address: 'AA:BB:CC:DD:EE:FF' });
    expect(r.status).toBe(200);
  });

  it('heartbeat devuelve ok:true', async () => {
    const r = await api.post('/devices/heartbeat').send({ mac_address: 'AA:BB:CC:DD:EE:FF' });
    expect(r.body.ok).toBe(true);
  });

  it('lista dispositivos autorizados retorna array', async () => {
    const r = await api.get('/devices/authorize').set(auth(token));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('autorizar y revocar dispositivo', async () => {
    const mac = `FE:DC:BA:98:76:${Math.floor(Math.random() * 90 + 10).toString(16).toUpperCase()}`;
    const r = await api.post('/devices/authorize').set(auth(token)).send({
      mac_address: mac,
      sucursal_id: SEED.caja_sucursal_id,
    });
    expect([200, 201]).toContain(r.status);
    const did = r.body.idequipos_autorizados ?? r.body.id;

    expect([200, 204]).toContain((await api.delete(`/devices/authorize/${did}`).set(auth(token))).status);
  });

  it('autorizar sin token retorna 401', async () => {
    const r = await api.post('/devices/authorize').send({ mac_address: 'AA:BB:CC:DD:EE:FF', sucursal_id: 1 });
    expect(r.status).toBe(401);
  });

  it('MAC con formato inválido retorna 400 o 500', async () => {
    const r = await api.post('/devices/authorize').set(auth(token)).send({
      mac_address: 'no-es-una-mac',
      sucursal_id: SEED.caja_sucursal_id,
    });
    expect([400, 500]).toContain(r.status);
  });
});
