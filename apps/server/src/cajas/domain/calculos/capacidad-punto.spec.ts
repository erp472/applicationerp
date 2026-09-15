import { describe, it, expect } from 'vitest';
import { calcularCapacidadPunto } from './capacidad-punto.js';

describe('calcularCapacidadPunto', () => {
  it('puede abrir más cajas', () => {
    // 1000000 / 200000 = 5; 5 - 2 = 3
    const r = calcularCapacidadPunto('1000000', '200000', 2);
    expect(r.capacidadTotal).toBe(5);
    expect(r.auxiliaresAbiertas).toBe(2);
    expect(r.puedeAbrirMas).toBe(true);
    expect(r.cuantasPuedeAbrir).toBe(3);
  });

  it('sin capacidad disponible', () => {
    // 400000 / 200000 = 2; 2 - 2 = 0
    const r = calcularCapacidadPunto('400000', '200000', 2);
    expect(r.puedeAbrirMas).toBe(false);
    expect(r.cuantasPuedeAbrir).toBe(0);
  });

  it('base insuficiente para ninguna', () => {
    // 100000 / 200000 = 0
    const r = calcularCapacidadPunto('100000', '200000', 0);
    expect(r.capacidadTotal).toBe(0);
    expect(r.puedeAbrirMas).toBe(false);
  });

  it('base mínima cero lanza error', () => {
    expect(() => calcularCapacidadPunto('500000', '0', 0)).toThrow('mayor a cero');
  });

  it('base mínima negativa lanza error', () => {
    expect(() => calcularCapacidadPunto('500000', '-100', 0)).toThrow();
  });
});
