import { describe, it, expect } from 'vitest';
import { calcularImpuestosAduanaDestino } from './impuestos-aduana-destino.js';

describe('calcularImpuestosAduanaDestino', () => {
  it('arancel estándar', () => {
    // 200 * 20 / 100 = 40.00
    expect(calcularImpuestosAduanaDestino('200', '20')).toBe('40.00');
  });

  it('19%', () => {
    expect(calcularImpuestosAduanaDestino('100', '19')).toBe('19.00');
  });

  it('arancel cero', () => {
    expect(calcularImpuestosAduanaDestino('500', '0')).toBe('0.00');
  });

  it('valor declarado cero', () => {
    expect(calcularImpuestosAduanaDestino('0', '15')).toBe('0.00');
  });

  it('fracción', () => {
    // 333.33 * 10 / 100 = 33.33
    expect(calcularImpuestosAduanaDestino('333.33', '10')).toBe('33.33');
  });
});
