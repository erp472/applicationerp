import { describe, it, expect } from 'vitest';
import { calcularFleteGiroNacional, type TramoFlete } from './flete-giro-nacional.js';

const TABLA: TramoFlete[] = [
  { valorMin: '0', valorMax: '100000', flete: '5000' },
  { valorMin: '100001', valorMax: '500000', flete: '8000' },
  { valorMin: '500001', valorMax: '2000000', flete: '12000' },
];

describe('calcularFleteGiroNacional', () => {
  it('primer rango', () => {
    expect(calcularFleteGiroNacional('50000', TABLA)).toBe('5000');
  });

  it('segundo rango', () => {
    expect(calcularFleteGiroNacional('200000', TABLA)).toBe('8000');
  });

  it('tercer rango', () => {
    expect(calcularFleteGiroNacional('1000000', TABLA)).toBe('12000');
  });

  it('fuera de rango lanza error', () => {
    expect(() => calcularFleteGiroNacional('9999999', TABLA)).toThrow('No se encontró flete');
  });

  it('lista vacía lanza error', () => {
    expect(() => calcularFleteGiroNacional('50000', [])).toThrow();
  });

  it('valor cero en primer rango', () => {
    expect(calcularFleteGiroNacional('0', TABLA)).toBe('5000');
  });
});
