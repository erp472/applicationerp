import { describe, it, expect } from 'vitest';
import { validarPesoMaximo } from './validar-peso-maximo.js';

describe('validarPesoMaximo', () => {
  it('dentro del límite no lanza', () => {
    expect(() => validarPesoMaximo(5, 30)).not.toThrow();
  });

  it('exactamente en el límite no lanza', () => {
    expect(() => validarPesoMaximo(30, 30)).not.toThrow();
  });

  it('supera el límite lanza PesoExcedeLimiteError', () => {
    expect(() => validarPesoMaximo(31, 30)).toThrow('supera el límite');
  });

  it('sin límite (null) siempre pasa', () => {
    expect(() => validarPesoMaximo(999, null)).not.toThrow();
  });

  it('límite cero lanza error para peso positivo', () => {
    expect(() => validarPesoMaximo(0.1, 0)).toThrow();
  });
});
