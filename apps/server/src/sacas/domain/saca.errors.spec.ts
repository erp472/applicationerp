import { describe, it, expect } from 'vitest';
import {
  SacaNoEncontradaError,
  SacaCerradaError,
  EnvioYaEnSacaError,
  EnvioNoEncontradoSacaError,
} from './saca.errors.js';

describe('Saca domain errors', () => {
  it('SacaNoEncontradaError incluye id en el mensaje', () => {
    const e = new SacaNoEncontradaError(3);
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toContain('3');
    expect(e.name).toBe('SacaNoEncontrada');
  });

  it('SacaCerradaError incluye id en el mensaje', () => {
    const e = new SacaCerradaError(5);
    expect(e.message).toContain('5');
    expect(e.name).toBe('SacaCerrada');
  });

  it('EnvioYaEnSacaError incluye envioId en el mensaje', () => {
    const e = new EnvioYaEnSacaError(9);
    expect(e.message).toContain('9');
    expect(e.name).toBe('EnvioYaEnSaca');
  });

  it('EnvioNoEncontradoSacaError incluye envioId en el mensaje', () => {
    const e = new EnvioNoEncontradoSacaError(12);
    expect(e.message).toContain('12');
    expect(e.name).toBe('EnvioNoEncontrado');
  });
});
