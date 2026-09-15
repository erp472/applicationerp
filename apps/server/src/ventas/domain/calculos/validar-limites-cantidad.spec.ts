import { describe, it, expect } from 'vitest';
import { validarLimitesCantidad } from './validar-limites-cantidad.js';

describe('validarLimitesCantidad', () => {
  it('dentro de rango retorna undefined', () => {
    expect(validarLimitesCantidad(5, 1, 10)).toBeUndefined();
  });

  it('sin límites retorna undefined', () => {
    expect(validarLimitesCantidad(999, null, null)).toBeUndefined();
  });

  it('exactamente en el mínimo', () => {
    expect(validarLimitesCantidad(1, 1, 10)).toBeUndefined();
  });

  it('exactamente en el máximo', () => {
    expect(validarLimitesCantidad(10, 1, 10)).toBeUndefined();
  });

  it('cantidad cero lanza error', () => {
    expect(() => validarLimitesCantidad(0, null, null)).toThrow('mayor a cero');
  });

  it('cantidad negativa lanza error', () => {
    expect(() => validarLimitesCantidad(-5, null, null)).toThrow('mayor a cero');
  });

  it('bajo el mínimo lanza error', () => {
    expect(() => validarLimitesCantidad(2, 5, 10)).toThrow('mínimo permitido');
  });

  it('sobre el máximo lanza error', () => {
    expect(() => validarLimitesCantidad(15, 1, 10)).toThrow('máximo permitido');
  });
});
