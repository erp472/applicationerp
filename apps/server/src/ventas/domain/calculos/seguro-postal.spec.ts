import { describe, it, expect } from 'vitest';
import { calcularSeguroPostal } from './seguro-postal.js';

describe('calcularSeguroPostal', () => {
  it('porcentaje estándar 0.5%', () => {
    // 100000 * 0.5 / 100 = 500
    expect(calcularSeguroPostal('100000', '0.5')).toBe('500');
  });

  it('porcentaje configurado 1.5%', () => {
    // 200000 * 1.5 / 100 = 3000
    expect(calcularSeguroPostal('200000', '1.5')).toBe('3000');
  });

  it('valor cero', () => {
    expect(calcularSeguroPostal('0', '0.5')).toBe('0');
  });

  it('redondeo al peso entero', () => {
    // 1000 * 0.3 / 100 = 3.0
    expect(calcularSeguroPostal('1000', '0.3')).toBe('3');
  });

  it('valor negativo lanza error', () => {
    expect(() => calcularSeguroPostal('-1000', '0.5')).toThrow('negativo');
  });

  it('porcentaje alto 5%', () => {
    // 50000 * 5 / 100 = 2500
    expect(calcularSeguroPostal('50000', '5')).toBe('2500');
  });

  it('mínimo aplica cuando el cálculo es menor', () => {
    // 1000 * 0.5 / 100 = 5 → pero mínimo es 500
    expect(calcularSeguroPostal('1000', '0.5', 500)).toBe('500');
  });

  it('mínimo no aplica cuando el cálculo ya lo supera', () => {
    // 200000 * 0.5 / 100 = 1000 → mínimo 500 no aplica
    expect(calcularSeguroPostal('200000', '0.5', 500)).toBe('1000');
  });

  it('mínimo exactamente igual al resultado', () => {
    // 100000 * 0.5 / 100 = 500 → mínimo 500 = resultado
    expect(calcularSeguroPostal('100000', '0.5', 500)).toBe('500');
  });
});
