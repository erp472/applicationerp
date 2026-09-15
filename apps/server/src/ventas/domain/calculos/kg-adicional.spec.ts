import { describe, it, expect } from 'vitest';
import { calcularKgAdicional } from './kg-adicional.js';

// pesoBaseKg = pesoMinKg del tramo tarifario (umbral a partir del cual aplica el adicional)
// Ejemplo real 4-72: tramo pesoMin=5 kg, pesoMax=null, tarifa base=$15.000, adicional=$2.000/kg
//   → paquete 7 kg: adicional = (7 - 5) * 2000 = $4.000

describe('calcularKgAdicional', () => {
  it('peso exactamente en el umbral — sin exceso', () => {
    // pesoBase = 5 (pesoMinKg del tramo), tarificado = 5 → exceso = 0
    expect(calcularKgAdicional(5, 5, '2000')).toBe('0');
  });

  it('tramo ilimitado: exceso de 2 kg sobre el umbral', () => {
    // pesoBase = 5 (pesoMinKg), tarificado = 7 → (7-5)*2000 = 4000
    expect(calcularKgAdicional(7, 5, '2000')).toBe('4000');
  });

  it('peso por debajo del umbral — sin exceso', () => {
    expect(calcularKgAdicional(3, 5, '2000')).toBe('0');
  });

  it('tarifa adicional cero — siempre da cero', () => {
    expect(calcularKgAdicional(10, 5, '0')).toBe('0');
  });

  it('fracción de kg', () => {
    // (5.5 - 5) * 1000 = 500
    expect(calcularKgAdicional(5.5, 5, '1000')).toBe('500');
  });

  it('tramo desde 0 — todo el peso es adicional', () => {
    // pesoBase = 0 (primer tramo), tarificado = 2.5 → 2.5 * 3000 = 7500
    expect(calcularKgAdicional(2.5, 0, '3000')).toBe('7500');
  });
});
