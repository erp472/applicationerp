import { describe, it, expect } from 'vitest';
import { verificarGiroIncluyeFlete, type ReglaFlete } from './giro-incluye-flete.js';

const REGLAS: ReglaFlete[] = [
  { operador: 'multipay', incluyeFlete: true },
  { operador: 'moneygram', incluyeFlete: false },
  { operador: 'ria', incluyeFlete: false },
];

describe('verificarGiroIncluyeFlete', () => {
  it('operador con flete retorna true', () => {
    expect(verificarGiroIncluyeFlete('multipay', REGLAS)).toBe(true);
  });

  it('operador sin flete retorna false', () => {
    expect(verificarGiroIncluyeFlete('moneygram', REGLAS)).toBe(false);
  });

  it('operador no registrado retorna false', () => {
    expect(verificarGiroIncluyeFlete('desconocido', REGLAS)).toBe(false);
  });

  it('lista vacía retorna false', () => {
    expect(verificarGiroIncluyeFlete('multipay', [])).toBe(false);
  });
});
