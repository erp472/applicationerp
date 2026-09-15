import { describe, it, expect } from 'vitest';
import { calcularTarifaInternacionalMs, type TarifaUpuRow } from './tarifa-internacional-ms.js';

const TARIFAS: TarifaUpuRow[] = [
  { paisDestino: 'USA', pesoMinKg: '0', pesoMaxKg: '1', tarifaCop: '45000', vigente: true },
  { paisDestino: 'USA', pesoMinKg: '1', pesoMaxKg: '5', tarifaCop: '90000', vigente: true },
  { paisDestino: 'ESP', pesoMinKg: '0', pesoMaxKg: '2', tarifaCop: '60000', vigente: true },
  { paisDestino: 'USA', pesoMinKg: '5', pesoMaxKg: '10', tarifaCop: '150000', vigente: false },
];

describe('calcularTarifaInternacionalMs', () => {
  it('primer rango USA', () => {
    expect(calcularTarifaInternacionalMs(TARIFAS, 'USA', 0.5)).toBe('45000');
  });

  it('segundo rango USA', () => {
    expect(calcularTarifaInternacionalMs(TARIFAS, 'USA', 3)).toBe('90000');
  });

  it('otro país', () => {
    expect(calcularTarifaInternacionalMs(TARIFAS, 'ESP', 1.5)).toBe('60000');
  });

  it('rango no vigente lanza error', () => {
    expect(() => calcularTarifaInternacionalMs(TARIFAS, 'USA', 7)).toThrow('No hay tarifa UPU');
  });

  it('país inexistente lanza error', () => {
    expect(() => calcularTarifaInternacionalMs(TARIFAS, 'MEX', 1)).toThrow('No hay tarifa UPU');
  });

  it('lista vacía lanza error', () => {
    expect(() => calcularTarifaInternacionalMs([], 'USA', 1)).toThrow();
  });
});
