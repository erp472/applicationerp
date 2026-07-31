import { describe, it, expect } from 'vitest';
import { calcularEstadoStock, validarStockSuficiente, evaluarAlertaReorden } from './business-rules.js';
import { StockInsuficienteInventarioError } from './inventario.errors.js';

describe('calcularEstadoStock', () => {
  it('ok cuando actual >= minimo', () => expect(calcularEstadoStock(10, 5)).toBe('ok'));
  it('ok cuando actual === minimo', () => expect(calcularEstadoStock(5, 5)).toBe('ok'));
  it('bajo cuando 0 < actual < minimo', () => expect(calcularEstadoStock(3, 5)).toBe('bajo'));
  it('critico cuando actual === 0', () => expect(calcularEstadoStock(0, 5)).toBe('critico'));
});

describe('validarStockSuficiente', () => {
  it('no lanza si hay stock suficiente', () => {
    expect(() => validarStockSuficiente('Caja', 10, 3)).not.toThrow();
  });
  it('lanza StockInsuficienteInventarioError si no hay stock', () => {
    expect(() => validarStockSuficiente('Caja', 2, 5))
      .toThrow(StockInsuficienteInventarioError);
  });
  it('lanza si cantidad solicitada es 0', () => {
    expect(() => validarStockSuficiente('Caja', 10, 0)).toThrow();
  });
});

describe('evaluarAlertaReorden', () => {
  it('alerta cuando stockPost <= minimo', () => expect(evaluarAlertaReorden(3, 5)).toBe(true));
  it('sin alerta cuando stockPost > minimo', () => expect(evaluarAlertaReorden(6, 5)).toBe(false));
});
