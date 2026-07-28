import { describe, it, expect } from 'vitest';
import { calcularTotalEnvioInternacional } from './total-envio-internacional.js';

describe('calcularTotalEnvioInternacional', () => {
  it('todos los componentes', () => {
    // 90000 + 5000 + 2000 = 97000
    expect(calcularTotalEnvioInternacional('90000', '5000', '2000')).toBe('97000');
  });

  it('solo tarifa', () => {
    expect(calcularTotalEnvioInternacional('90000')).toBe('90000');
  });

  it('sin estampilla', () => {
    expect(calcularTotalEnvioInternacional('90000', '3000')).toBe('93000');
  });

  it('todo cero', () => {
    expect(calcularTotalEnvioInternacional('0', '0', '0')).toBe('0');
  });
});
