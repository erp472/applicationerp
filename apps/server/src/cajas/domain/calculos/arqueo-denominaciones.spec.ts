import { describe, it, expect } from 'vitest';
import { calcularArqueo, calcularArqueoDesglosado, compararArqueoConSaldo } from './arqueo-denominaciones.js';

describe('calcularArqueo', () => {
  it('suma denominacion × cantidad para cada billete', () => {
    const result = calcularArqueo([
      { denominacion: 50000, cantidad: 3 },
      { denominacion: 20000, cantidad: 5 },
      { denominacion: 10000, cantidad: 2 },
    ]);
    expect(result.total).toBe('270000.00');
    expect(result.desglose).toHaveLength(3);
  });

  it('verifica subtotales individuales', () => {
    const result = calcularArqueo([
      { denominacion: 50000, cantidad: 2 },
      { denominacion: 1000, cantidad: 10 },
    ]);
    expect(result.desglose[0].subtotal).toBe('100000.00');
    expect(result.desglose[1].subtotal).toBe('10000.00');
    expect(result.total).toBe('110000.00');
  });

  it('retorna total cero para lista vacía', () => {
    const result = calcularArqueo([]);
    expect(result.total).toBe('0.00');
    expect(result.desglose).toHaveLength(0);
  });

  it('una sola denominación', () => {
    const result = calcularArqueo([{ denominacion: 100000, cantidad: 1 }]);
    expect(result.total).toBe('100000.00');
    expect(result.desglose).toHaveLength(1);
  });
});

describe('compararArqueoConSaldo', () => {
  it('detecta cuadre exacto', () => {
    const result = compararArqueoConSaldo(
      [
        { denominacion: 50000, cantidad: 2 },
        { denominacion: 20000, cantidad: 1 },
        { denominacion: 10000, cantidad: 3 },
      ],
      '150000',
    );
    expect(result.tipoDiferencia).toBe('cuadre');
    expect(result.diferencia).toBe('0.00');
  });

  it('detecta sobrante (arqueo > esperado)', () => {
    const result = compararArqueoConSaldo([{ denominacion: 50000, cantidad: 3 }], '100000');
    expect(result.tipoDiferencia).toBe('sobrante');
    expect(result.diferencia).toBe('50000.00');
  });

  it('detecta faltante (arqueo < esperado)', () => {
    const result = compararArqueoConSaldo([{ denominacion: 10000, cantidad: 5 }], '80000');
    expect(result.tipoDiferencia).toBe('faltante');
    expect(result.diferencia).toBe('-30000.00');
  });

  it('preserva saldoEsperado en resultado', () => {
    const result = compararArqueoConSaldo([{ denominacion: 1000, cantidad: 10 }], '8000');
    expect(result.saldoEsperado).toBe('8000');
  });

  it('desglose incluye subtotal por denominación', () => {
    const result = compararArqueoConSaldo([{ denominacion: 20000, cantidad: 2 }], '40000');
    expect(result.desglose[0].subtotal).toBe('40000.00');
    expect(result.desglose[0].cantidad).toBe(2);
  });
});

// RF-3.01: desglose obligatorio por tipo billete/moneda
describe('calcularArqueoDesglosado', () => {
  it('separa billetes y monedas en totales independientes', () => {
    const result = calcularArqueoDesglosado([
      { denominacion: 50000, cantidad: 3, tipo: 'billete' },
      { denominacion: 20000, cantidad: 2, tipo: 'billete' },
      { denominacion: 500,   cantidad: 4, tipo: 'moneda'  },
      { denominacion: 200,   cantidad: 5, tipo: 'moneda'  },
    ]);
    expect(result.totalBilletes).toBe('190000.00');   // 150000 + 40000
    expect(result.totalMonedas).toBe('3000.00');       // 2000 + 1000
    expect(result.total).toBe('193000.00');
    expect(result.desglose).toHaveLength(4);
  });

  it('solo billetes — totalMonedas en cero', () => {
    const result = calcularArqueoDesglosado([
      { denominacion: 100000, cantidad: 2, tipo: 'billete' },
    ]);
    expect(result.totalBilletes).toBe('200000.00');
    expect(result.totalMonedas).toBe('0.00');
    expect(result.total).toBe('200000.00');
  });

  it('solo monedas — totalBilletes en cero', () => {
    const result = calcularArqueoDesglosado([
      { denominacion: 1000, cantidad: 10, tipo: 'moneda' },
      { denominacion: 500,  cantidad: 6,  tipo: 'moneda' },
    ]);
    expect(result.totalBilletes).toBe('0.00');
    expect(result.totalMonedas).toBe('13000.00');
  });

  it('lista vacía — todos los totales en cero', () => {
    const result = calcularArqueoDesglosado([]);
    expect(result.total).toBe('0.00');
    expect(result.totalBilletes).toBe('0.00');
    expect(result.totalMonedas).toBe('0.00');
  });
});
