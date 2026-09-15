import { describe, it, expect } from 'vitest';
import { calcularCajasHabilitadas } from './cajas-habilitadas.js';

describe('calcularCajasHabilitadas', () => {
  it('agrupa por tipo', () => {
    const cajas = [
      { cajaId: 1, tipo: 'general', activaEnSesion: true },
      { cajaId: 2, tipo: 'general', activaEnSesion: false },
      { cajaId: 3, tipo: 'pos', activaEnSesion: true },
      { cajaId: 4, tipo: 'pagos', activaEnSesion: false },
      { cajaId: 5, tipo: 'menor', activaEnSesion: true },
    ];
    const r = calcularCajasHabilitadas(cajas);
    expect(r.general.cajas).toHaveLength(2);
    expect(r.general.activas).toBe(1);
    expect(r.pos.cajas).toHaveLength(1);
    expect(r.pos.activas).toBe(1);
    expect(r.pagos.cajas).toHaveLength(1);
    expect(r.pagos.activas).toBe(0);
    expect(r.menor.cajas).toHaveLength(1);
    expect(r.menor.activas).toBe(1);
  });

  it('ignora tipo inválido', () => {
    const r = calcularCajasHabilitadas([
      { cajaId: 1, tipo: 'general', activaEnSesion: true },
      { cajaId: 2, tipo: 'DESCONOCIDO', activaEnSesion: true },
    ]);
    expect(r.general.cajas).toHaveLength(1);
    expect('DESCONOCIDO' in r).toBe(false);
  });

  it('sin cajas', () => {
    const r = calcularCajasHabilitadas([]);
    for (const tipo of ['general', 'pos', 'pagos', 'menor'] as const) {
      expect(r[tipo].cajas).toHaveLength(0);
      expect(r[tipo].activas).toBe(0);
    }
  });

  it('todas inactivas', () => {
    const r = calcularCajasHabilitadas([
      { cajaId: 1, tipo: 'pos', activaEnSesion: false },
      { cajaId: 2, tipo: 'pos', activaEnSesion: false },
    ]);
    expect(r.pos.activas).toBe(0);
    expect(r.pos.cajas).toHaveLength(2);
  });
});
