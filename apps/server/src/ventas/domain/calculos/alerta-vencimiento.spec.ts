import { describe, it, expect } from 'vitest';
import { evaluarAlertaVencimientoApartado } from './alerta-vencimiento.js';

describe('evaluarAlertaVencimientoApartado', () => {
  it('dentro del umbral genera alerta', () => {
    const result = evaluarAlertaVencimientoApartado(10, 30, 5, 42, 1);
    expect(result.generarAlerta).toBe(true);
    expect(result.payloadAlerta?.tipo).toBe('apartado_por_vencer');
    expect(result.payloadAlerta?.apartadoId).toBe(5);
    expect(result.payloadAlerta?.clienteId).toBe(42);
    expect(result.payloadAlerta?.sucursalId).toBe(1);
    expect(result.payloadAlerta?.diasRestantes).toBe(10);
  });

  it('exactamente en el umbral genera alerta', () => {
    const result = evaluarAlertaVencimientoApartado(30, 30, 1, 1, 1);
    expect(result.generarAlerta).toBe(true);
  });

  it('fuera del umbral no genera alerta', () => {
    const result = evaluarAlertaVencimientoApartado(60, 30, 5, 42, 1);
    expect(result.generarAlerta).toBe(false);
    expect(result.payloadAlerta).toBeNull();
  });

  it('ya venció (-5 días) genera alerta', () => {
    const result = evaluarAlertaVencimientoApartado(-5, 30, 1, 1, 1);
    expect(result.generarAlerta).toBe(true);
    expect(result.payloadAlerta?.diasRestantes).toBe(-5);
  });
});
