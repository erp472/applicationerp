import { describe, it, expect } from 'vitest';
import { calcularDescuentoTotalVenta } from './descuento-total-venta.js';

describe('calcularDescuentoTotalVenta', () => {
  it('varias líneas', () => {
    expect(
      calcularDescuentoTotalVenta([
        { descuentoMonto: '5000' },
        { descuentoMonto: '3000' },
      ]),
    ).toBe('8000');
  });

  it('sin descuento explícito usa cero', () => {
    expect(calcularDescuentoTotalVenta([{}, {}])).toBe('0');
  });

  it('lista vacía retorna cero', () => {
    expect(calcularDescuentoTotalVenta([])).toBe('0');
  });

  it('una línea', () => {
    expect(calcularDescuentoTotalVenta([{ descuentoMonto: '1000' }])).toBe('1000');
  });

  it('descuentos cero', () => {
    expect(
      calcularDescuentoTotalVenta([{ descuentoMonto: '0' }, { descuentoMonto: '0' }]),
    ).toBe('0');
  });
});
