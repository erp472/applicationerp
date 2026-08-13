import { describe, it, expect } from 'vitest';
import { calcularPesoVolumetrico } from './peso-volumetrico.js';

describe('calcularPesoVolumetrico', () => {
  it('factor por defecto 5000 (estándar 4-72/Colombia)', () => {
    // 30 * 20 * 10 / 5000 = 1.2
    expect(calcularPesoVolumetrico(30, 20, 10)).toBeCloseTo(1.2);
  });

  it('factor personalizado', () => {
    // 50 * 50 * 50 / 5000 = 25
    expect(calcularPesoVolumetrico(50, 50, 50, 5000)).toBe(25);
  });

  it('dimensión cero da cero', () => {
    expect(calcularPesoVolumetrico(0, 20, 10)).toBe(0);
  });

  it('dimensiones pequeñas', () => {
    // 10 * 10 * 10 / 5000 = 0.2
    expect(calcularPesoVolumetrico(10, 10, 10)).toBeCloseTo(0.2);
  });
});
