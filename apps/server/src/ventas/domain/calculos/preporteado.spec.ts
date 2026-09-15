import { describe, it, expect } from 'vitest';
import { validarPreporteado } from './preporteado.js';

describe('validarPreporteado', () => {
  it('coincidencia exacta no lanza', () => {
    expect(() => validarPreporteado('15000', '15000')).not.toThrow();
  });

  it('diferencia positiva lanza error', () => {
    expect(() => validarPreporteado('16000', '15000')).toThrow('Preporteado no corresponde');
  });

  it('diferencia negativa lanza error', () => {
    expect(() => validarPreporteado('14000', '15000')).toThrow('Preporteado no corresponde');
  });

  it('ambos cero no lanza', () => {
    expect(() => validarPreporteado('0', '0')).not.toThrow();
  });
});
