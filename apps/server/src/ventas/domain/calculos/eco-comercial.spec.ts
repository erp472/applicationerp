import { describe, it, expect } from 'vitest';
import { calcularEcoComercial } from './eco-comercial.js';

describe('calcularEcoComercial', () => {
  it('inactivo retorna cero', () => {
    expect(calcularEcoComercial('50000', { tipo: 'fija', valor: '3000' }, false)).toBe('0');
  });

  it('tipo fija', () => {
    expect(calcularEcoComercial('50000', { tipo: 'fija', valor: '3000' }, true)).toBe('3000');
  });

  it('tipo porcentual', () => {
    // 50000 * 2 / 100 = 1000
    expect(calcularEcoComercial('50000', { tipo: 'porcentual', valor: '2' }, true)).toBe('1000');
  });

  it('tipo inválido lanza error', () => {
    expect(() =>
      calcularEcoComercial('50000', { tipo: 'desconocido' as any, valor: '100' }, true),
    ).toThrow('inválido');
  });

  it('inactivo por defecto', () => {
    expect(calcularEcoComercial('50000', { tipo: 'fija', valor: '500' })).toBe('0');
  });

  it('porcentual con redondeo', () => {
    // 10001 * 1 / 100 = 100.01 → 100
    expect(calcularEcoComercial('10001', { tipo: 'porcentual', valor: '1' }, true)).toBe('100');
  });
});
