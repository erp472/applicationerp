import { describe, it, expect } from 'vitest';
import {
  SERVICIOS_CAJA,
  CODIGOS_SERVICIO_CAJA,
  esServicioCajaValido,
  construirServiciosCaja,
} from './servicios-caja.js';

describe('servicios-caja', () => {
  describe('esServicioCajaValido', () => {
    it('retorna true para todos los códigos válidos', () => {
      for (const codigo of CODIGOS_SERVICIO_CAJA) {
        expect(esServicioCajaValido(codigo)).toBe(true);
      }
    });

    it('retorna false para un código inexistente', () => {
      expect(esServicioCajaValido('servicio_invalido')).toBe(false);
    });

    it('retorna false para string vacío', () => {
      expect(esServicioCajaValido('')).toBe(false);
    });
  });

  describe('construirServiciosCaja', () => {
    it('retorna todos los servicios activos cuando no hay overrides', () => {
      const servicios = construirServiciosCaja(new Map());
      expect(servicios).toHaveLength(CODIGOS_SERVICIO_CAJA.length);
      expect(servicios.every(s => s.activo)).toBe(true);
    });

    it('aplica override inactivo a un servicio específico', () => {
      const overrides = new Map([['giro_nacional_emision', false]]);
      const servicios = construirServiciosCaja(overrides);
      const giro = servicios.find(s => s.codigo === 'giro_nacional_emision');
      expect(giro?.activo).toBe(false);
    });

    it('los demás servicios permanecen activos cuando se inhabilita uno', () => {
      const overrides = new Map([['estampillas', false]]);
      const servicios = construirServiciosCaja(overrides);
      const restantes = servicios.filter(s => s.codigo !== 'estampillas');
      expect(restantes.every(s => s.activo)).toBe(true);
    });

    it('incluye el nombre legible de cada servicio', () => {
      const servicios = construirServiciosCaja(new Map());
      for (const s of servicios) {
        expect(s.nombre).toBe(SERVICIOS_CAJA[s.codigo]);
      }
    });

    it('permite inhabilitar múltiples servicios simultáneamente', () => {
      const overrides = new Map<string, boolean>([
        ['giro_nacional_emision', false],
        ['giro_internacional_emision', false],
      ]);
      const servicios = construirServiciosCaja(overrides);
      const inactivos = servicios.filter(s => !s.activo);
      expect(inactivos).toHaveLength(2);
    });
  });
});
