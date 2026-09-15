import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Cajas — /cajas', () => {
  let token: string;
  beforeAll(async () => { token = await login('admin_sistema'); });

  describe('Status', () => {
    it('status por sucursal tiene campos correctos', async () => {
      const r = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(token));
      expect(r.status).toBe(200);
      expect(r.body).toHaveProperty('sucursalId');
      expect(r.body).toHaveProperty('panel');
      expect(r.body).toHaveProperty('cajas');
      expect(Array.isArray(r.body.cajas)).toBe(true);
    });

    it('panel tiene campos financieros', async () => {
      const r = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(token));
      for (const campo of ['baseGeneral', 'cajaGeneral', 'cajaFuerteGeneral', 'acumuladoMonedaCirculante']) {
        expect(r.body.panel).toHaveProperty(campo);
      }
    });

    it('panel-admin lista todas las sucursales', async () => {
      const r = await api.get('/cajas/panel-admin').set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
      expect(r.body.length).toBeGreaterThan(0);
    });

    it('sucursal inexistente retorna 200 o 404', async () => {
      expect([200, 404]).toContain((await api.get('/cajas/sucursal/999999/status').set(auth(token))).status);
    });

    it('sin token retorna 401', async () => {
      expect((await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`)).status).toBe(401);
    });
  });

  describe('CRUD y consultas', () => {
    it('lista cajas padres retorna array', async () => {
      const r = await api.get('/cajas').set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    });

    it('obtener caja padre por id', async () => {
      const r = await api.get(`/cajas/${SEED.caja_padre_id}`).set(auth(token));
      expect(r.status).toBe(200);
      expect(r.body.id).toBe(SEED.caja_padre_id);
    });

    it('lista auxiliares por sucursal retorna array', async () => {
      const r = await api.get(`/cajas/auxiliares?sucursalId=${SEED.caja_sucursal_id}`).set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    });

    it('capacidad de punto tiene campos esperados', async () => {
      const r = await api.get(`/cajas/principales/${SEED.caja_padre_id}/capacidad`).set(auth(token));
      expect(r.status).toBe(200);
      for (const campo of ['capacidadTotal', 'auxiliaresAbiertas', 'puedeAbrirMas']) {
        expect(r.body).toHaveProperty(campo);
      }
    });

    it('asignación de sucursal tiene campo cajas', async () => {
      const r = await api.get(`/cajas/asignacion/sucursal/${SEED.caja_sucursal_id}`).set(auth(token));
      expect(r.status).toBe(200);
      expect(r.body).toHaveProperty('cajas');
    });

    it('alertas de cierre automático retorna array', async () => {
      const r = await api.get(`/cajas/alertas/cierre-automatico?sucursalId=${SEED.caja_sucursal_id}`).set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    });

    it('diferencias pendientes retorna array', async () => {
      const r = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/diferencias-pendientes`).set(auth(token));
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    });

    it('consolidado comercio retorna objeto', async () => {
      const r = await api.get('/cajas/consolidado-comercio?comercioId=1').set(auth(token));
      expect(r.status).toBe(200);
      const hasKey = 'total' in r.body || 'comercioId' in r.body;
      expect(hasKey).toBe(true);
    });
  });

  describe('Flujo sesión principal', () => {
    it('si ya existe sesión general: consultar saldo y movimientos', async () => {
      const status = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(token));
      const general = status.body.cajas.find((c: { tipo: string; sesionId: number | null }) =>
        c.tipo === 'general' && c.sesionId,
      );

      if (general) {
        const sid = general.sesionId;
        expect((await api.get(`/cajas/punto/${sid}/saldo`).set(auth(token))).status).toBe(200);
        expect((await api.get(`/cajas/punto/${sid}/movimientos`).set(auth(token))).status).toBe(200);
        return;
      }

      // Abrir sesión si no existe
      const r = await api.post(`/cajas/principales/${SEED.caja_padre_id}/sesion/abrir`).set(auth(token))
        .send({ montoApertura: '500000' });

      if ([400, 409].includes(r.status)) return; // ya abierta por otro test
      expect([200, 201]).toContain(r.status);
      const sid = r.body.id;

      expect((await api.get(`/cajas/punto/${sid}/saldo`).set(auth(token))).status).toBe(200);

      // Cerrar con denominaciones (RF-3.01)
      const rc = await api.post(`/cajas/principales/${sid}/sesion/cerrar`).set(auth(token)).send({
        totalArqueo:   '500000',
        observaciones: 'Cierre e2e vitest',
        denominaciones: [{ denominacion: 50000, tipo: 'billete', cantidad: 10, valorTotal: 500000 }],
      });
      expect([200, 201]).toContain(rc.status);
      expect(rc.body.estado).toBe('cerrada');
    });
  });
});
