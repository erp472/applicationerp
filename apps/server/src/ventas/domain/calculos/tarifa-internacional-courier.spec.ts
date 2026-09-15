import { describe, it, expect } from 'vitest';
import { extraerTarifaCourier } from './tarifa-internacional-courier.js';

describe('extraerTarifaCourier', () => {
  it('extrae tarifa normal', () => {
    expect(extraerTarifaCourier({ tarifaCop: '250000', proveedor: 'HES' })).toBe('250000');
  });

  it('tarifa cero es válida', () => {
    expect(extraerTarifaCourier({ tarifaCop: '0' })).toBe('0');
  });

  it('sin clave tarifaCop lanza error', () => {
    expect(() => extraerTarifaCourier({ proveedor: 'ANICAN' })).toThrow('tarifaCop');
  });

  it('dict vacío lanza error', () => {
    expect(() => extraerTarifaCourier({})).toThrow();
  });
});
