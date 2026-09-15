import { describe, it, expect } from 'vitest';
import { calcularComisionGiroInternacional } from './comision-giro-internacional.js';

describe('calcularComisionGiroInternacional', () => {
  it('comisión fija', () => {
    expect(calcularComisionGiroInternacional('500000', { tipo: 'fija', valor: '15000' }, 'moneygram')).toBe('15000');
  });

  it('comisión porcentual 3%', () => {
    // 500000 * 3 / 100 = 15000
    expect(calcularComisionGiroInternacional('500000', { tipo: 'porcentual', valor: '3' }, 'ria')).toBe('15000');
  });

  it('comisión porcentual 2.5%', () => {
    // 100000 * 2.5 / 100 = 2500
    expect(calcularComisionGiroInternacional('100000', { tipo: 'porcentual', valor: '2.5' }, 'ifs')).toBe('2500');
  });

  it('tipo inválido lanza error', () => {
    expect(() =>
      calcularComisionGiroInternacional('100000', { tipo: 'desconocido' as any, valor: '5000' }, 'moneygram'),
    ).toThrow('Tipo de comisión inválido');
  });

  it('fija cero', () => {
    expect(calcularComisionGiroInternacional('500000', { tipo: 'fija', valor: '0' }, 'ria')).toBe('0');
  });
});
