import { describe, it, expect } from 'vitest';
import { validarDimensionesMaximas, DimensionesMáximasExcedenError } from './validar-dimensiones-maximas.js';

describe('validarDimensionesMaximas', () => {
  it('dentro de los límites — no lanza', () => {
    expect(() => validarDimensionesMaximas(40, 30, 30, 60, 50, 50)).not.toThrow();
  });

  it('sin límites configurados — siempre pasa', () => {
    expect(() => validarDimensionesMaximas(200, 200, 200, null, null, null)).not.toThrow();
  });

  it('exactamente en el límite — no lanza', () => {
    expect(() => validarDimensionesMaximas(60, 50, 50, 60, 50, 50)).not.toThrow();
  });

  it('alto excede límite — lanza error', () => {
    expect(() => validarDimensionesMaximas(61, 30, 30, 60, 50, 50)).toThrow('alto');
    expect(() => validarDimensionesMaximas(61, 30, 30, 60, 50, 50)).toThrow('61');
  });

  it('ancho excede límite — lanza error', () => {
    expect(() => validarDimensionesMaximas(40, 51, 30, 60, 50, 50)).toThrow('ancho');
  });

  it('largo excede límite — lanza error', () => {
    expect(() => validarDimensionesMaximas(40, 30, 51, 60, 50, 50)).toThrow('largo');
  });

  it('error tiene statusCode 422', () => {
    try {
      validarDimensionesMaximas(100, 30, 30, 60, 50, 50);
    } catch (e) {
      expect(e).toBeInstanceOf(DimensionesMáximasExcedenError);
      expect((e as DimensionesMáximasExcedenError).statusCode).toBe(422);
    }
  });

  it('límite solo en largo — alto y ancho sin restricción', () => {
    expect(() => validarDimensionesMaximas(999, 999, 50, null, null, 50)).not.toThrow();
    expect(() => validarDimensionesMaximas(999, 999, 51, null, null, 50)).toThrow('largo');
  });
});
