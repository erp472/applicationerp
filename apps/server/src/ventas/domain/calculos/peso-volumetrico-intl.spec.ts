import { describe, it, expect } from 'vitest';
import { calcularPesoVolumetricoIntl } from './peso-volumetrico-intl.js';

describe('calcularPesoVolumetricoIntl', () => {
  it('sin límite de proveedor — siempre válido', () => {
    // 10*10*10 / 2500 = 0.4
    const r = calcularPesoVolumetricoIntl(10, 10, 10, 2500);
    expect(r.pesoVol).toBeCloseTo(0.4);
    expect(r.valido).toBe(true);
    expect(r.pesoMaximoProveedor).toBeNull();
  });

  it('dentro del límite', () => {
    // 20*20*20 / 2500 = 3.2 <= 100
    const r = calcularPesoVolumetricoIntl(20, 20, 20, 2500, 100);
    expect(r.valido).toBe(true);
    expect(r.pesoVol).toBeCloseTo(3.2);
  });

  it('excede el límite', () => {
    // 100*100*100 / 2500 = 400 > 10
    const r = calcularPesoVolumetricoIntl(100, 100, 100, 2500, 10);
    expect(r.valido).toBe(false);
    expect(r.pesoMaximoProveedor).toBe(10);
  });

  it('exactamente en el borde — válido', () => {
    // 50*50*100 / 2500 = 100 == 100
    const r = calcularPesoVolumetricoIntl(50, 50, 100, 2500, 100);
    expect(r.pesoVol).toBeCloseTo(100);
    expect(r.valido).toBe(true);
  });
});
