import { describe, it, expect } from 'vitest';
import { calcularIvaVenta } from './iva-venta.js';

describe('calcularIvaVenta', () => {
  it('una línea 19% IVA embebido', () => {
    // precioBruto=100000, precioSinTax=84034 → IVA=15966
    expect(
      calcularIvaVenta([{ precioBruto: '100000', precioSinTax: '84034', cantidad: 1 }]),
    ).toBe('15966');
  });

  it('varias líneas', () => {
    // (119000-100000)*1 + (11900-10000)*2 = 19000 + 3800 = 22800
    expect(
      calcularIvaVenta([
        { precioBruto: '119000', precioSinTax: '100000', cantidad: 1 },
        { precioBruto: '11900', precioSinTax: '10000', cantidad: 2 },
      ]),
    ).toBe('22800');
  });

  it('producto exento — IVA cero', () => {
    expect(
      calcularIvaVenta([{ precioBruto: '50000', precioSinTax: '50000', cantidad: 5 }]),
    ).toBe('0');
  });

  it('lista vacía retorna cero', () => {
    expect(calcularIvaVenta([])).toBe('0');
  });

  it('cantidad múltiple', () => {
    // (11900-10000)*10 = 19000
    expect(
      calcularIvaVenta([{ precioBruto: '11900', precioSinTax: '10000', cantidad: 10 }]),
    ).toBe('19000');
  });
});
