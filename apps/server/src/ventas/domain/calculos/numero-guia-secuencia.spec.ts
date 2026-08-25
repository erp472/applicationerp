import { describe, it, expect } from 'vitest';
import {
  calcularDigitoVerificadorS10,
  generarCodigoTrackingS10,
  generarNumeroGuiaSecuencia,
} from './numero-guia-secuencia.js';

// ── generarNumeroGuiaSecuencia ────────────────────────────────────────────────

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

  it('genera número legible para certificados (sin check digit ni CO)', () => {
    expect(generarNumeroGuiaSecuencia('RA', 18519403)).toBe('RA18519403');
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
});

// ── calcularDigitoVerificadorS10 (UPU Modulo 11) ─────────────────────────────

describe('calcularDigitoVerificadorS10', () => {
  it('ejemplo real de guía física: 18519403 → dígito 8', () => {
    // Verificado manualmente: 1×8+8×6+5×4+1×2+9×3+4×5+0×9+3×7 = 146 → 146%11=3 → 11-3=8
    expect(calcularDigitoVerificadorS10('18519403')).toBe(8);
  });

  it('residuo 0 → dígito verificador 5', () => {
    // 00000000 → sum=0, 0%11=0 → 5
    expect(calcularDigitoVerificadorS10('00000000')).toBe(5);
  });

  it('residuo 1 → dígito verificador 0', () => {
    // 10100000 → 1×8+1×4=12, 12%11=1 → 0
    expect(calcularDigitoVerificadorS10('10100000')).toBe(0);
  });

  it('lanza error si el serial tiene menos de 8 dígitos', () => {
    expect(() => calcularDigitoVerificadorS10('1234567')).toThrow('8 dígitos');
  });

  it('lanza error si el serial tiene más de 8 dígitos', () => {
    expect(() => calcularDigitoVerificadorS10('123456789')).toThrow('8 dígitos');
  });
});

// ── generarCodigoTrackingS10 ──────────────────────────────────────────────────

describe('generarCodigoTrackingS10', () => {
  it('ejemplo real: RA+18519403 → RA185194038CO', () => {
    expect(generarCodigoTrackingS10('RA', 18519403)).toBe('RA185194038CO');
  });

  it('rellena el serial con ceros para consecutivos pequeños', () => {
    const result = generarCodigoTrackingS10('RA', 1);
    // RA + 00000001 + digito + CO → 13 chars
    expect(result).toHaveLength(13);
    expect(result).toMatch(/^RA00000001\dCO$/);
  });

  it('siempre produce un código de longitud 13 (2+8+1+2)', () => {
    expect(generarCodigoTrackingS10('EA', 99999999)).toHaveLength(13);
  });

  it('usa el país proporcionado', () => {
    const result = generarCodigoTrackingS10('RA', 18519403, 'MX');
    expect(result.endsWith('MX')).toBe(true);
  });
});
