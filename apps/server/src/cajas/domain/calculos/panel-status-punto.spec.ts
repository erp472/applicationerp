import { describe, it, expect } from 'vitest';
import { componerPanelStatus } from './panel-status-punto.js';

describe('componerPanelStatus', () => {
  it('retorna todos los campos correctamente', () => {
    const result = componerPanelStatus(
      '1000000', '800000', '600000',
      '500000', '400000', '300000',
      '50000',
    );
    expect(result.baseGeneral).toBe('1000000');
    expect(result.cajaGeneral).toBe('800000');
    expect(result.cajaFuerteGeneral).toBe('600000');
    expect(result.basePagos).toBe('500000');
    expect(result.cajaPagos).toBe('400000');
    expect(result.cajaFuertePagos).toBe('300000');
    expect(result.acumuladoMonedaCirculante).toBe('50000');
  });

  it('valores en cero', () => {
    const result = componerPanelStatus('0', '0', '0', '0', '0', '0', '0');
    expect(result.baseGeneral).toBe('0');
    expect(result.cajaPagos).toBe('0');
    expect(result.acumuladoMonedaCirculante).toBe('0');
  });
});
