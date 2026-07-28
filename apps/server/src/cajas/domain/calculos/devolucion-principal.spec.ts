import { describe, it, expect } from 'vitest';
import { calcularDevolucionAPrincipal } from './devolucion-principal.js';

describe('calcularDevolucionAPrincipal', () => {
  it('genera par de movimientos correctos', () => {
    const result = calcularDevolucionAPrincipal('200000');
    expect(result.monto).toBe('200000');
    expect(result.movimientoAuxiliar.tipoMovimiento).toBe('cambio_custodia_out');
    expect(result.movimientoAuxiliar.esEntrada).toBe(false);
    expect(result.movimientoPrincipal.tipoMovimiento).toBe('cambio_custodia_in');
    expect(result.movimientoPrincipal.esEntrada).toBe(true);
  });

  it('saldo cero es válido', () => {
    const result = calcularDevolucionAPrincipal('0');
    expect(result.monto).toBe('0');
  });

  it('saldo negativo lanza error', () => {
    expect(() => calcularDevolucionAPrincipal('-1')).toThrow('negativo');
  });
});
