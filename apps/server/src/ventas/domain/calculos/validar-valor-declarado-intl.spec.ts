import { describe, it, expect } from 'vitest';
import { validarValorDeclaradoIntl } from './validar-valor-declarado-intl.js';

describe('validarValorDeclaradoIntl', () => {
  it('valor válido no lanza', () => {
    expect(() => validarValorDeclaradoIntl('500000')).not.toThrow();
  });

  it('exactamente en el máximo default', () => {
    expect(() => validarValorDeclaradoIntl('15000000')).not.toThrow();
  });

  it('valor cero lanza error', () => {
    expect(() => validarValorDeclaradoIntl('0')).toThrow('mayor a cero');
  });

  it('valor negativo lanza error', () => {
    expect(() => validarValorDeclaradoIntl('-1')).toThrow('mayor a cero');
  });

  it('supera máximo default lanza error', () => {
    expect(() => validarValorDeclaradoIntl('15000001')).toThrow('supera el máximo');
  });

  it('máximo personalizado válido', () => {
    expect(() => validarValorDeclaradoIntl('900000', '1000000')).not.toThrow();
  });

  it('supera máximo personalizado lanza error', () => {
    expect(() => validarValorDeclaradoIntl('2000000', '1000000')).toThrow('supera el máximo');
  });
});
