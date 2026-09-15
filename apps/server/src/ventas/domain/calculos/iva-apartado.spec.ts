import { describe, it, expect } from 'vitest';
import { calcularIvaApartado } from './iva-apartado.js';

describe('calcularIvaApartado', () => {
  it('con IVA 19%', () => {
    const result = calcularIvaApartado('100000', '19', true);
    expect(result.precioSinTax).toBe('100000');
    expect(result.iva).toBe('19000');
    expect(result.precioTotal).toBe('119000');
    expect(result.incluyeIva).toBe(true);
  });

  it('sin IVA', () => {
    const result = calcularIvaApartado('100000', '19', false);
    expect(result.iva).toBe('0');
    expect(result.precioTotal).toBe('100000');
    expect(result.incluyeIva).toBe(false);
  });

  it('default incluyeIva = true', () => {
    const result = calcularIvaApartado('50000', '19');
    expect(result.incluyeIva).toBe(true);
    expect(result.iva).toBe('9500');
  });

  it('redondeo correcto', () => {
    // 87500 * 19 / 100 = 16625
    const result = calcularIvaApartado('87500', '19', true);
    expect(result.iva).toBe('16625');
    expect(result.precioTotal).toBe('104125');
  });

  it('precio cero', () => {
    const result = calcularIvaApartado('0', '19', true);
    expect(result.iva).toBe('0');
    expect(result.precioTotal).toBe('0');
  });
});
