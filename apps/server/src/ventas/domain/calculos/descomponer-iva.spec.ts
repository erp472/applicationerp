import { describe, it, expect } from 'vitest';
import { descomponerIva } from './descomponer-iva.js';

describe('descomponerIva', () => {
  it('calcula sin_tax desde bruto (IVA 19%)', () => {
    const result = descomponerIva(11900, 19);
    const sinTaxEsperado = 11900 / 1.19;
    expect(result.precioBruto).toBe(11900);
    expect(result.precioSinTax).toBeCloseTo(sinTaxEsperado, 5);
    expect(result.ivaUnitario).toBeCloseTo(11900 - sinTaxEsperado, 5);
  });

  it('usa precio_sin_tax explícito cuando se provee', () => {
    const result = descomponerIva(11900, 19, 10000);
    expect(result.precioSinTax).toBe(10000);
    expect(result.ivaUnitario).toBe(1900);
    expect(result.precioBruto).toBe(11900);
  });

  it('tasa cero — sin_tax igual al bruto', () => {
    const result = descomponerIva(5000, 0);
    expect(result.precioSinTax).toBe(5000);
    expect(result.ivaUnitario).toBe(0);
  });

  it('IVA extraído del bruto es menor a bruto × tasa (no bug #1)', () => {
    const result = descomponerIva(11900, 19);
    // Si hubiera bug: iva = 11900 * 0.19 = 2261; correcto ≈ 1900
    expect(result.ivaUnitario).toBeLessThan(2000);
  });
});
