import { describe, it, expect } from 'vitest';
import { generarPinGiroNacional } from './pin-giro-nacional.js';

describe('generarPinGiroNacional', () => {
  it('longitud 6 dígitos', () => {
    expect(generarPinGiroNacional(new Set())).toHaveLength(6);
  });

  it('solo dígitos', () => {
    expect(/^\d{6}$/.test(generarPinGiroNacional(new Set()))).toBe(true);
  });

  it('no está en los existentes', () => {
    const existentes = new Set(['000001', '000002', '123456', '654321']);
    const pin = generarPinGiroNacional(existentes);
    expect(existentes.has(pin)).toBe(false);
    expect(pin).toHaveLength(6);
  });

  it('unicidad con algunos existentes', () => {
    const existentes = new Set(['000001', '000002', '000003']);
    expect(existentes.has(generarPinGiroNacional(existentes))).toBe(false);
  });

  it('retorna string no vacío', () => {
    const pin = generarPinGiroNacional(new Set());
    expect(typeof pin).toBe('string');
    expect(pin.length).toBeGreaterThan(0);
  });
});
