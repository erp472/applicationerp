import { describe, it, expect } from 'vitest';
import { calcularTotalEnvioNacional } from './total-envio-nacional.js';

describe('calcularTotalEnvioNacional', () => {
  it('solo servicio', () => {
    expect(calcularTotalEnvioNacional('15000')).toBe('15000');
  });

  it('todos los componentes', () => {
    // 15000 + 1000 + 500 + 300 = 16800
    expect(calcularTotalEnvioNacional('15000', '1000', '500', '300')).toBe('16800');
  });

  it('con estampillas', () => {
    expect(calcularTotalEnvioNacional('15000', '2000')).toBe('17000');
  });

  it('todo cero', () => {
    expect(calcularTotalEnvioNacional('0', '0', '0', '0')).toBe('0');
  });
});
