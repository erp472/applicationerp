import { describe, it, expect } from 'vitest';
import { calcularPesoVolumetrico } from './peso-volumetrico.js';

describe('calcularPesoVolumetrico', () => {
  it('factor por defecto 2500', () => {
    // 30 * 20 * 10 / 2500 = 2.4
    expect(calcularPesoVolumetrico(30, 20, 10)).toBeCloseTo(2.4);
  });

  it('factor personalizado', () => {
    // 50 * 50 * 50 / 5000 = 25
    expect(calcularPesoVolumetrico(50, 50, 50, 5000)).toBe(25);
  });

  it('dimensión cero da cero', () => {
    expect(calcularPesoVolumetrico(0, 20, 10)).toBe(0);
  });

  it('dimensiones pequeñas', () => {
    // 10 * 10 * 10 / 2500 = 0.4
    expect(calcularPesoVolumetrico(10, 10, 10)).toBeCloseTo(0.4);
  });
});
