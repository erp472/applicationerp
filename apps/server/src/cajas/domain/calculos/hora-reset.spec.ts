import { describe, it, expect } from 'vitest';
import { evaluarHoraReset } from './hora-reset.js';

describe('evaluarHoraReset', () => {
  it('debe resetear cuando hora actual supera la hora de reset', () => {
    const result = evaluarHoraReset('06:30', '06:00');
    expect(result.debeResetear).toBe(true);
    expect(result.horaReset).toBe('06:00');
  });

  it('debe resetear exactamente en la hora de reset', () => {
    const result = evaluarHoraReset('06:00', '06:00');
    expect(result.debeResetear).toBe(true);
  });

  it('no debe resetear antes de la hora de reset', () => {
    const result = evaluarHoraReset('05:59', '06:00');
    expect(result.debeResetear).toBe(false);
  });

  it('medianoche exacta', () => {
    const result = evaluarHoraReset('00:00', '00:00');
    expect(result.debeResetear).toBe(true);
  });

  it('preserva horaReset en el resultado', () => {
    const result = evaluarHoraReset('07:00', '06:00');
    expect(result.horaReset).toBe('06:00');
  });
});
