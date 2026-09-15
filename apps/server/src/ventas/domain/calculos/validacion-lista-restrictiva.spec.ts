import { describe, it, expect } from 'vitest';
import { validarListaRestrictiva, type EntradaListaRestrictiva } from './validacion-lista-restrictiva.js';

const LISTAS: EntradaListaRestrictiva[] = [
  { cedula: '12345678', tipoAlerta: 'bloqueado' },
  { cedula: '87654321', tipoAlerta: 'alerta' },
];

describe('validarListaRestrictiva', () => {
  it('bloqueado', () => {
    const r = validarListaRestrictiva('12345678', LISTAS);
    expect(r.resultado).toBe('bloqueado');
    expect(r.requiereRevisionManual).toBe(false);
  });

  it('alerta requiere revisión', () => {
    const r = validarListaRestrictiva('87654321', LISTAS);
    expect(r.resultado).toBe('alerta');
    expect(r.requiereRevisionManual).toBe(true);
  });

  it('cédula limpia retorna ok', () => {
    const r = validarListaRestrictiva('99999999', LISTAS);
    expect(r.resultado).toBe('ok');
    expect(r.requiereRevisionManual).toBe(false);
  });

  it('modo manual ok requiere revisión', () => {
    const r = validarListaRestrictiva('99999999', LISTAS, 'manual');
    expect(r.resultado).toBe('ok');
    expect(r.requiereRevisionManual).toBe(true);
  });

  it('lista vacía retorna ok', () => {
    expect(validarListaRestrictiva('12345678', []).resultado).toBe('ok');
  });
});
