import { describe, it, expect } from 'vitest';
import { calcularPesoVolumetricoIntl } from './peso-volumetrico-intl.js';

describe('calcularPesoVolumetricoIntl', () => {
  it('factor por defecto 6000 (UPU estándar internacional)', () => {
    // 10*10*10 / 6000 ≈ 0.167
    const r = calcularPesoVolumetricoIntl(10, 10, 10);
    expect(r.pesoVol).toBeCloseTo(0.167);
    expect(r.valido).toBe(true);
    expect(r.pesoMaximoProveedor).toBeNull();
  });

  it('sin límite de proveedor — siempre válido', () => {
    // 30*30*30 / 6000 = 4.5
    const r = calcularPesoVolumetricoIntl(30, 30, 30, 6000);
    expect(r.pesoVol).toBeCloseTo(4.5);
    expect(r.valido).toBe(true);
    expect(r.pesoMaximoProveedor).toBeNull();
  });

  it('dentro del límite', () => {
    // 20*20*20 / 6000 ≈ 1.333 <= 30
    const r = calcularPesoVolumetricoIntl(20, 20, 20, 6000, 30);
    expect(r.valido).toBe(true);
    expect(r.pesoVol).toBeCloseTo(1.333);
  });

  it('excede el límite', () => {
    // 200*100*100 / 6000 ≈ 333 > 30
    const r = calcularPesoVolumetricoIntl(200, 100, 100, 6000, 30);
    expect(r.valido).toBe(false);
    expect(r.pesoMaximoProveedor).toBe(30);
  });

  it('exactamente en el borde — válido', () => {
    // 60*50*100 / 6000 = 50 == 50
    const r = calcularPesoVolumetricoIntl(60, 50, 100, 6000, 50);
    expect(r.pesoVol).toBeCloseTo(50);
    expect(r.valido).toBe(true);
  });
});
