import { describe, it, expect } from 'vitest';
import { componerPanelStatus, calcularBaseDisponible } from './panel-status-punto.js';

describe('calcularBaseDisponible', () => {
  it('reparte el saldo completo de la Caja Fuerte abierta', () => {
    expect(calcularBaseDisponible(3000000, 3000000, 0)).toBe(3000000);
  });

  // El bug de Medellín: abrir la Fuerte con la base completa dejaba disponible en 0
  // y el supervisor no podía abrir ninguna caja del punto.
  it('no deja el punto sin cupo cuando la Fuerte abre con la base completa', () => {
    expect(calcularBaseDisponible(3000000, 3000000, 0)).toBeGreaterThan(0);
  });

  it('descuenta lo ya entregado, que sale del saldo de la Fuerte', () => {
    expect(calcularBaseDisponible(3000000, 2550000, 0)).toBe(2550000);
  });

  it('sin Caja Fuerte abierta descuenta las aperturas standalone de la base', () => {
    expect(calcularBaseDisponible(3000000, null, 450000)).toBe(2550000);
  });

  it('nunca devuelve un cupo negativo', () => {
    expect(calcularBaseDisponible(3000000, null, 4000000)).toBe(0);
  });
});

describe('componerPanelStatus', () => {
  it('retorna todos los campos correctamente', () => {
    const result = componerPanelStatus(
      '1000000', '800000', '600000',
      '500000', '400000', '300000',
      '50000', '0', '200000',
    );
    expect(result.baseGeneral).toBe('1000000');
    expect(result.cajaGeneral).toBe('800000');
    expect(result.cajaFuerteGeneral).toBe('600000');
    expect(result.basePagos).toBe('500000');
    expect(result.cajaPagos).toBe('400000');
    expect(result.cajaFuertePagos).toBe('300000');
    expect(result.acumuladoMonedaCirculante).toBe('50000');
    expect(result.tTransito).toBe('0');
    expect(result.baseDisponible).toBe('200000');
  });

  it('valores en cero', () => {
    const result = componerPanelStatus('0', '0', '0', '0', '0', '0', '0', '0', '0');
    expect(result.baseGeneral).toBe('0');
    expect(result.cajaPagos).toBe('0');
    expect(result.acumuladoMonedaCirculante).toBe('0');
    expect(result.tTransito).toBe('0');
    expect(result.baseDisponible).toBe('0');
  });

  it('debeReset true cuando se pasa true', () => {
    const result = componerPanelStatus('1000000', '800000', '600000', '0', '0', '0', '0', '0', '0', true, '22:00');
    expect(result.debeReset).toBe(true);
    expect(result.horaReset).toBe('22:00');
  });

  it('debeReset false por defecto cuando no se especifica', () => {
    const result = componerPanelStatus('500000', '400000', '350000', '0', '0', '0', '0', '0', '0');
    expect(result.debeReset).toBe(false);
    expect(result.horaReset).toBeNull();
  });

  it('debeReset false con horaReset null cuando no aplica reset', () => {
    const result = componerPanelStatus('0', '0', '0', '0', '0', '0', '0', '0', '0', false, null);
    expect(result.debeReset).toBe(false);
    expect(result.horaReset).toBeNull();
  });
});
