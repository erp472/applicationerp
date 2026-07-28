import { describe, it, expect } from 'vitest';
import { evaluarCierreForzado } from './cierre-forzado.js';

describe('evaluarCierreForzado', () => {
  it('debe forzar cuando supera el máximo de horas', () => {
    const apertura = new Date('2026-07-28T08:00:00Z');
    const actual = new Date('2026-07-28T20:00:00Z');
    const result = evaluarCierreForzado(apertura, actual, 10);
    expect(result.debeForzar).toBe(true);
    expect(result.horasTranscurridas).toBe(12);
    expect(result.tipoAlerta).toBe('cierre_forzado');
  });

  it('no debe forzar cuando no supera el máximo', () => {
    const apertura = new Date('2026-07-28T08:00:00Z');
    const actual = new Date('2026-07-28T14:00:00Z');
    const result = evaluarCierreForzado(apertura, actual, 10);
    expect(result.debeForzar).toBe(false);
    expect(result.horasTranscurridas).toBe(6);
    expect(result.tipoAlerta).toBeNull();
  });

  it('exactamente en el límite — no forzar', () => {
    const apertura = new Date('2026-07-28T08:00:00Z');
    const actual = new Date('2026-07-28T18:00:00Z');
    const result = evaluarCierreForzado(apertura, actual, 10);
    expect(result.debeForzar).toBe(false);
    expect(result.horasTranscurridas).toBe(10);
  });

  it('preserva maxHorasSesion en resultado', () => {
    const apertura = new Date('2026-07-28T00:00:00Z');
    const actual = new Date('2026-07-29T01:00:00Z');
    const result = evaluarCierreForzado(apertura, actual, 8);
    expect(result.maxHorasSesion).toBe(8);
    expect(result.debeForzar).toBe(true);
  });
});
