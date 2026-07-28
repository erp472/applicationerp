import { describe, it, expect } from 'vitest';
import { generarCufeElectronica } from './cufe-electronica.js';

const CAMPOS: Record<string, string> = {
  NumFac: 'FVE000000001',
  FecFac: '2026-07-28',
  HorFac: '10:00:00',
  ValFac: '100000.00',
  CodImp1: '01',
  ValImp1: '19000.00',
  CodImp2: '04',
  ValImp2: '0.00',
  CodImp3: '03',
  ValImp3: '0.00',
  ValTot: '119000.00',
  NitOFE: '900123456',
  NumAdq: '12345678',
};
const CLAVE = 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c';

describe('generarCufeElectronica', () => {
  it('retorna string no vacío', () => {
    const cufe = generarCufeElectronica(CAMPOS, CLAVE);
    expect(typeof cufe).toBe('string');
    expect(cufe.length).toBeGreaterThan(0);
  });

  it('longitud SHA-384 (96 hex chars)', () => {
    expect(generarCufeElectronica(CAMPOS, CLAVE)).toHaveLength(96);
  });

  it('solo caracteres hexadecimales', () => {
    const cufe = generarCufeElectronica(CAMPOS, CLAVE);
    expect(/^[0-9a-f]+$/.test(cufe)).toBe(true);
  });

  it('determinista — mismas entradas mismo hash', () => {
    expect(generarCufeElectronica(CAMPOS, CLAVE)).toBe(generarCufeElectronica(CAMPOS, CLAVE));
  });

  it('cambia si cambia un campo', () => {
    const alt = { ...CAMPOS, ValFac: '200000.00' };
    expect(generarCufeElectronica(CAMPOS, CLAVE)).not.toBe(generarCufeElectronica(alt, CLAVE));
  });

  it('campos vacíos no lanza error', () => {
    const cufe = generarCufeElectronica({}, 'clave_vacia');
    expect(cufe).toHaveLength(96);
  });
});
