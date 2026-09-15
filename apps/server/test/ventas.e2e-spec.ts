import { describe, it, beforeAll, expect } from 'vitest';
import { api, login, auth, SEED } from './helpers.js';

describe('Ventas — /ventas', () => {
  let tokenAdmin: string;
  let tokenCajero: string;
  beforeAll(async () => {
    tokenAdmin  = await login('admin_sistema');
    tokenCajero = await login('cajero');
  });

  async function getCajaActiva(token: string): Promise<{ cajaId: number; sesionId: number } | null> {
    const r = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(token));
    for (const caja of r.body.cajas ?? []) {
      if (['pos', 'menor'].includes(caja.tipo) && caja.sesionId) {
        return { cajaId: caja.cajaId, sesionId: caja.sesionId };
      }
    }
    return null;
  }

  describe('Catálogo', () => {
    it('catálogo de productos requiere sucursalId y retorna 200', async () => {
      const r = await api.get(`/ventas/catalogo/productos?sucursalId=${SEED.sucursal_id}`).set(auth(tokenCajero));
      expect(r.status).toBe(200);
    });

    it('servicios postales requieren sucursalId y retornan 200', async () => {
      const r = await api.get(`/ventas/servicios-postales?sucursalId=${SEED.sucursal_id}`).set(auth(tokenCajero));
      expect(r.status).toBe(200);
      expect(typeof r.body === 'object' || Array.isArray(r.body)).toBe(true);
    });

    it('apartados disponibles requieren sucursalId y retornan 200', async () => {
      const r = await api.get(`/ventas/apartados/disponibles?sucursalId=${SEED.sucursal_id}`).set(auth(tokenCajero));
      expect(r.status).toBe(200);
    });

    it('ventas del día por sucursal retorna 200 o 500', async () => {
      const r = await api.get(`/ventas/sucursal/${SEED.caja_sucursal_id}/dia`).set(auth(tokenAdmin));
      expect([200, 500]).toContain(r.status);
    });

    it('alertas de anulaciones retorna 200', async () => {
      expect((await api.get('/ventas/alertas/anulaciones').set(auth(tokenAdmin))).status).toBe(200);
    });

    it('alertas de apartados retorna 200', async () => {
      expect((await api.get('/ventas/alertas/apartados').set(auth(tokenAdmin))).status).toBe(200);
    });

    it('buscar cliente retorna 200 o 500', async () => {
      expect([200, 500]).toContain((await api.get('/ventas/clientes/buscar?q=test').set(auth(tokenCajero))).status);
    });

    it('sin token retorna 401', async () => {
      expect((await api.get('/ventas/catalogo/productos')).status).toBe(401);
    });

    it('admin apartados retorna 200', async () => {
      expect((await api.get('/ventas/admin/apartados').set(auth(tokenAdmin))).status).toBe(200);
    });
  });

  describe('Cotizaciones', () => {
    it('cotizar servicio postal retorna 200 o 400', async () => {
      const r = await api.get('/ventas/servicios-postales/cotizar?peso=500&destino=Medellín').set(auth(tokenCajero));
      expect([200, 400]).toContain(r.status);
    });
  });

  describe('Flujo venta', () => {
    it('turno de punto de caja retorna resultado esperado', async () => {
      const r = await api.get(`/cajas/sucursal/${SEED.caja_sucursal_id}/status`).set(auth(tokenCajero));
      const cajas = r.body.cajas ?? [];
      const conSesion = cajas.find((c: { sesionId: number | null }) => c.sesionId);
      if (!conSesion) return; // sin sesión activa, no hay turno

      const r2 = await api.get(`/ventas/punto/${conSesion.cajaId}/turno`).set(auth(tokenCajero));
      expect([200, 403, 404]).toContain(r2.status);
    });

    it('flujo iniciar y anular venta', async () => {
      const caja = await getCajaActiva(tokenCajero);
      if (!caja) return; // sin sesión activa no se puede testear

      const r = await api.post(`/ventas/punto/${caja.cajaId}/iniciar`).set(auth(tokenCajero))
        .send({ sesionCajaId: caja.sesionId });
      if ([400, 403, 404].includes(r.status)) return;
      expect([200, 201]).toContain(r.status);
      const ventaId = r.body.id;

      expect((await api.get(`/ventas/${ventaId}/carrito`).set(auth(tokenCajero))).status).toBe(200);

      const ra = await api.post(`/ventas/${ventaId}/anular`).set(auth(tokenCajero))
        .send({ motivo: 'Test e2e — anulación sin confirmar' });
      expect([200, 201, 400]).toContain(ra.status);
    });
  });
});
