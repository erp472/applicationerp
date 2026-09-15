import { describe, it, expect } from 'vitest';
import { validarGuiaCp } from './guia-cp-validacion.js';

describe('validarGuiaCp', () => {
  it('formato correcto no lanza', () => {
    expect(() => validarGuiaCp('AA12345678BB', [])).not.toThrow();
  });

  it('minúsculas aceptadas', () => {
    expect(() => validarGuiaCp('aa12345678bb', [])).not.toThrow();
  });

  it('formato corto lanza error', () => {
    expect(() => validarGuiaCp('AA123456BB', [])).toThrow('Formato de guía CP inválido');
  });

  it('letras intermedias lanza error', () => {
    expect(() => validarGuiaCp('AA1234567XBB', [])).toThrow('Formato de guía CP inválido');
  });

  it('duplicada lanza error', () => {
    expect(() =>
      validarGuiaCp('AA12345678BB', ['AA12345678BB', 'CC99999999DD']),
    ).toThrow('ya está registrada');
  });

  it('duplicada case-insensitive lanza error', () => {
    expect(() => validarGuiaCp('aa12345678bb', ['AA12345678BB'])).toThrow('ya está registrada');
  });

  it('distinta guía en lista no lanza', () => {
    expect(() => validarGuiaCp('AA12345678BB', ['CC99999999DD'])).not.toThrow();
  });
});
