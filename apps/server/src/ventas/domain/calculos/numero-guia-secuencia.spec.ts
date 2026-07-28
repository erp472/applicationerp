import { describe, it, expect } from 'vitest';
import { generarNumeroGuiaSecuencia } from './numero-guia-secuencia.js';

describe('generarNumeroGuiaSecuencia', () => {
  it('formato con prefijo y cero-relleno', () => {
    expect(generarNumeroGuiaSecuencia('COL', 123)).toBe('COL00000123');
  });

  it('relleno a 8 dígitos', () => {
    expect(generarNumeroGuiaSecuencia('P', 1)).toBe('P00000001');
  });

  it('consecutivo grande', () => {
    expect(generarNumeroGuiaSecuencia('X', 99999999)).toBe('X99999999');
  });

  it('usa SIGMA retorna guía SIGMA', () => {
    expect(generarNumeroGuiaSecuencia('COL', 1, true, 'SIG-2025-001')).toBe('SIG-2025-001');
  });

  it('SIGMA sin guía lanza error', () => {
    expect(() => generarNumeroGuiaSecuencia('COL', 1, true, null)).toThrow('guia_sigma');
  });

  it('consecutivo cero lanza error', () => {
    expect(() => generarNumeroGuiaSecuencia('COL', 0)).toThrow('mayor a cero');
  });

  it('consecutivo negativo lanza error', () => {
    expect(() => generarNumeroGuiaSecuencia('COL', -5)).toThrow('mayor a cero');
  });

  it('retorna string no vacío', () => {
    const r = generarNumeroGuiaSecuencia('G', 42);
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });
});
