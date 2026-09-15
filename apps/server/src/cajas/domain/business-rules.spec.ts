import { describe, it, expect } from 'vitest';
import {
  validarUnicidadSesion,
  validarSesionAbierta,
  validarSaldoSuficiente,
  validarAperturaPunto,
  validarBaseAsignadaMaxima,
  validarConsignacionPendiente,
  evaluarAlertas,
  afectaEfectivo,
  deltaEfectivo,
} from './business-rules.js';
import {
  CajaYaAbiertaError,
  SesionYaCerradaError,
  SaldoInsuficienteError,
  AperturaExcedeAsignacionPuntoError,
  BaseExcedeLimiteCajaError,
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

  describe('BR-CAJ-010 validarAperturaPunto', () => {
    it('rechaza abrir el punto con el global de la Caja General', () => {
      expect(() => validarAperturaPunto('5000000', '1000000', 'Punto Bogotá Centro'))
        .toThrow(AperturaExcedeAsignacionPuntoError);
    });
    it('permite abrir exactamente con la base asignada al punto', () => {
      expect(() => validarAperturaPunto('1000000', '1000000', 'Punto Bogotá Centro')).not.toThrow();
    });
    it('permite abrir por debajo de la base asignada', () => {
      expect(() => validarAperturaPunto('400000', '1000000', 'Punto Bogotá Centro')).not.toThrow();
    });
    it('nombra el punto y su base en el mensaje', () => {
      expect(() => validarAperturaPunto('5000000', '1000000', 'Punto Bogotá Centro'))
        .toThrow(/Punto Bogotá Centro/);
    });
  });

  describe('BR-CAJ-009 validarBaseAsignadaMaxima', () => {
    it('rechaza asignar a un POS la bóveda entera del punto', () => {
      expect(() => validarBaseAsignadaMaxima('5000000', '500000', 'POS-BOG-001-01'))
        .toThrow(BaseExcedeLimiteCajaError);
    });
    it('permite la base exacta configurada', () => {
      expect(() => validarBaseAsignadaMaxima('500000', '500000', 'POS-BOG-001-01')).not.toThrow();
    });
    it('permite una base menor a la configurada', () => {
      expect(() => validarBaseAsignadaMaxima('200000', '500000', 'POS-BOG-001-01')).not.toThrow();
    });
    it('nombra la caja y el fondo configurado en el mensaje', () => {
      expect(() => validarBaseAsignadaMaxima('5000000', '500000', 'POS-BOG-001-01'))
        .toThrow(/POS-BOG-001-01/);
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

  describe('afectaEfectivo', () => {
    it('trata los movimientos internos sin medio de pago como efectivo', () => {
      expect(afectaEfectivo(null)).toBe(true);
      expect(afectaEfectivo(undefined)).toBe(true);
    });
    it('acepta el efectivo declarado', () => {
      expect(afectaEfectivo('efectivo')).toBe(true);
    });
    it('rechaza los medios que no entran al cajón', () => {
      for (const medio of ['tarjeta_debito', 'tarjeta_credito', 'transferencia',
                           'consignacion', 'cheque', 'preporteado',
                           'mixto_preporteado', 'estampilla']) {
        expect(afectaEfectivo(medio)).toBe(false);
      }
    });
  });

  describe('deltaEfectivo', () => {
    it('suma una venta en efectivo', () => {
      expect(deltaEfectivo('venta_producto', 11204, 'efectivo')).toBe(11204);
    });
    it('no mueve el cajón con una venta con tarjeta', () => {
      expect(deltaEfectivo('venta_producto', 350000, 'tarjeta_credito')).toBe(0);
    });
    it('no mueve el cajón con un apartado preporteado', () => {
      expect(deltaEfectivo('apartado_postal', 87500, 'preporteado')).toBe(0);
    });
    it('resta las salidas de efectivo', () => {
      expect(deltaEfectivo('cambio_custodia_out', 96224, null)).toBe(-96224);
    });
    it('ignora los tipos neutros como apertura', () => {
      expect(deltaEfectivo('apertura', 500000, null)).toBe(0);
    });
  });
});
