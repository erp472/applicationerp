import { describe, it, expect } from 'vitest';
import { verificarStockDisponible, evaluarAlertaStockMinimo } from './stock-disponible.js';

describe('verificarStockDisponible', () => {
  it('hay stock sin alerta de reorden', () => {
    const result = verificarStockDisponible(100, 10, 5);
    expect(result.disponible).toBe(true);
    expect(result.stockPostVenta).toBe(90);
    expect(result.alertaReorden).toBe(false);
  });

  it('hay stock con alerta de reorden', () => {
    const result = verificarStockDisponible(6, 2, 5);
    expect(result.disponible).toBe(true);
    expect(result.stockPostVenta).toBe(4);
    expect(result.alertaReorden).toBe(true);
  });

  it('exactamente en el mínimo genera alerta', () => {
    const result = verificarStockDisponible(10, 5, 5);
    expect(result.stockPostVenta).toBe(5);
    expect(result.alertaReorden).toBe(true);
  });

  it('stock insuficiente lanza error', () => {
    expect(() => verificarStockDisponible(3, 5, 2)).toThrow('insuficiente');
  });

  it('cantidad cero lanza error', () => {
    expect(() => verificarStockDisponible(10, 0, 2)).toThrow('mayor a cero');
  });
});

describe('evaluarAlertaStockMinimo', () => {
  it('no genera alerta cuando stock > mínimo', () => {
    const result = evaluarAlertaStockMinimo(20, 5, 1, 2);
    expect(result.generarAlerta).toBe(false);
    expect(result.payloadAlerta).toBeNull();
  });

  it('genera alerta cuando stock < mínimo', () => {
    const result = evaluarAlertaStockMinimo(3, 5, 10, 3);
    expect(result.generarAlerta).toBe(true);
    expect(result.payloadAlerta?.tipo).toBe('stock_minimo');
    expect(result.payloadAlerta?.productoId).toBe(10);
    expect(result.payloadAlerta?.sucursalId).toBe(3);
    expect(result.payloadAlerta?.stockActual).toBe(3);
    expect(result.payloadAlerta?.stockMinimo).toBe(5);
  });

  it('genera alerta exactamente en el mínimo', () => {
    const result = evaluarAlertaStockMinimo(5, 5, 7, 1);
    expect(result.generarAlerta).toBe(true);
  });

  it('stock cero genera alerta', () => {
    const result = evaluarAlertaStockMinimo(0, 10, 4, 2);
    expect(result.generarAlerta).toBe(true);
    expect(result.payloadAlerta).not.toBeNull();
  });
});
