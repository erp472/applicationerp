import { describe, it, expect } from 'vitest';
import {
  validarUnicidadSesion,
  validarSesionAbierta,
  validarSaldoSuficiente,
  validarCajaGeneralMinimo,
  validarConsignacionPendiente,
  evaluarAlertas,
} from './business-rules.js';
import {
  CajaYaAbiertaError,
  SesionYaCerradaError,
  SaldoInsuficienteError,
  BaseMinimaVioladaError,
  ConsignacionEstadoInvalidoError,
} from './caja.errors.js';

describe('Cajas business rules', () => {

  describe('BR-CAJ-001 validarUnicidadSesion', () => {
    it('lanza CajaYaAbiertaError si ya existe sesión abierta', () => {
      expect(() => validarUnicidadSesion(1, true)).toThrow(CajaYaAbiertaError);
    });
    it('no lanza si la caja no tiene sesión abierta', () => {
      expect(() => validarUnicidadSesion(1, false)).not.toThrow();
    });
  });

  describe('BR-CAJ-002 validarSesionAbierta', () => {
    it('lanza SesionYaCerradaError si la sesión está cerrada', () => {
      expect(() => validarSesionAbierta(5, 'cerrada')).toThrow(SesionYaCerradaError);
    });
    it('lanza SesionYaCerradaError si la sesión fue forzada', () => {
      expect(() => validarSesionAbierta(5, 'forzada')).toThrow(SesionYaCerradaError);
    });
    it('no lanza si la sesión está abierta', () => {
      expect(() => validarSesionAbierta(5, 'abierta')).not.toThrow();
    });
  });

  describe('BR-CAJ-003 validarSaldoSuficiente', () => {
    it('lanza SaldoInsuficienteError cuando el saldo es menor al monto', () => {
      expect(() => validarSaldoSuficiente('80.00', '100.00')).toThrow(SaldoInsuficienteError);
    });
    it('no lanza cuando el saldo es exactamente igual al monto', () => {
      expect(() => validarSaldoSuficiente('100.00', '100.00')).not.toThrow();
    });
    it('no lanza cuando el saldo es mayor al monto', () => {
      expect(() => validarSaldoSuficiente('110.00', '100.00')).not.toThrow();
    });
  });

  describe('BR-CAJ-004 validarCajaGeneralMinimo', () => {
    it('lanza BaseMinimaVioladaError si la operación deja la caja general por debajo del mínimo', () => {
      expect(() => validarCajaGeneralMinimo('500000', '400000', '200000')).toThrow(BaseMinimaVioladaError);
    });
    it('permite la operación si la caja general queda exactamente en el mínimo', () => {
      expect(() => validarCajaGeneralMinimo('500000', '300000', '200000')).not.toThrow();
    });
    it('permite la operación si la caja general queda por encima del mínimo', () => {
      expect(() => validarCajaGeneralMinimo('500000', '100000', '200000')).not.toThrow();
    });
  });

  describe('BR-CAJ-005 validarConsignacionPendiente', () => {
    it('lanza ConsignacionEstadoInvalidoError si ya fue aprobada', () => {
      expect(() => validarConsignacionPendiente(1, 'aprobada')).toThrow(ConsignacionEstadoInvalidoError);
    });
    it('lanza ConsignacionEstadoInvalidoError si ya fue rechazada', () => {
      expect(() => validarConsignacionPendiente(1, 'rechazada')).toThrow(ConsignacionEstadoInvalidoError);
    });
    it('no lanza si está pendiente', () => {
      expect(() => validarConsignacionPendiente(1, 'pendiente')).not.toThrow();
    });
  });

  describe('BR-CAJ-006 evaluarAlertas', () => {
    it('detecta saldo bajo la base', () => {
      const alertas = evaluarAlertas('80000', '100000', null);
      expect(alertas).toContain('reposicion_caja');
    });
    it('detecta saldo sobre el límite', () => {
      const alertas = evaluarAlertas('600000', '100000', '500000');
      expect(alertas).toContain('limite_efectivo_caja');
    });
    it('no genera alertas cuando el saldo está en rango normal', () => {
      const alertas = evaluarAlertas('200000', '100000', '500000');
      expect(alertas).toHaveLength(0);
    });
    it('puede tener ambas alertas simultáneamente si los umbrales lo permiten', () => {
      const alertas = evaluarAlertas('80000', '100000', '50000');
      expect(alertas).toContain('reposicion_caja');
      expect(alertas).toContain('limite_efectivo_caja');
    });
    it('no lanza limite_efectivo_caja si limiteAlerta es null', () => {
      const alertas = evaluarAlertas('1000000', '100000', null);
      expect(alertas).not.toContain('limite_efectivo_caja');
    });
  });
});
