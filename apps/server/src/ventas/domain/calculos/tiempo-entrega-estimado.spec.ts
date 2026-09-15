import { describe, it, expect } from 'vitest';
import { calcularTiempoEntregaEstimado } from './tiempo-entrega-estimado.js';

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('calcularTiempoEntregaEstimado', () => {
  it('días hábiles simples sin domingo', () => {
    // Lunes 2025-01-06 + 3 días hábiles
    const hoy = new Date(2025, 0, 6);
    const r = calcularTiempoEntregaEstimado(hoy, 3);
    expect(localKey(r)).toBe('2025-01-09'); // Jueves
  });

  it('salta sábado y domingo', () => {
    // Viernes 2025-01-10 + 2 días hábiles: Sab(skip), Dom(skip), Lun(1), Mar(2)
    const hoy = new Date(2025, 0, 10);
    const r = calcularTiempoEntregaEstimado(hoy, 2);
    expect(localKey(r)).toBe('2025-01-14'); // Martes (no lunes — sábado ya no cuenta)
  });

  it('salta solo el sábado', () => {
    // Jueves 2025-01-09 + 2 días hábiles: Vie(1), Sab(skip), Dom(skip), Lun(2)
    const hoy = new Date(2025, 0, 9);
    const r = calcularTiempoEntregaEstimado(hoy, 2);
    expect(localKey(r)).toBe('2025-01-13'); // Lunes
  });

  it('festivo retrasa la entrega', () => {
    const hoy = new Date(2025, 0, 1);
    const festivos = [new Date(2025, 0, 2)];
    const sinFestivo = calcularTiempoEntregaEstimado(hoy, 2);
    const conFestivo = calcularTiempoEntregaEstimado(hoy, 2, festivos);
    expect(conFestivo.getTime()).toBeGreaterThan(sinFestivo.getTime());
  });

  it('un día hábil', () => {
    const hoy = new Date(2025, 5, 2); // Lunes jun-2
    const r = calcularTiempoEntregaEstimado(hoy, 1);
    expect(localKey(r)).toBe('2025-06-03'); // Martes
  });

  it('retorna un objeto Date', () => {
    const r = calcularTiempoEntregaEstimado(new Date(2025, 0, 1), 5);
    expect(r).toBeInstanceOf(Date);
  });

  it('festivos null funciona igual que sin festivos', () => {
    const hoy = new Date(2025, 2, 3); // Lunes
    const r = calcularTiempoEntregaEstimado(hoy, 1, null);
    expect(localKey(r)).toBe('2025-03-04');
  });
});
