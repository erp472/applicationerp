import { describe, it, expect } from 'vitest';
import { calcularPrecioCliente } from './precio-cliente.js';

describe('calcularPrecioCliente', () => {
  it('retorna tarifa vigente del tipo de cliente', () => {
    const tarifas = [
      { tipoClienteId: 1, precio: '8000', vigente: true },
      { tipoClienteId: 2, precio: '9000', vigente: true },
    ];
    expect(calcularPrecioCliente(tarifas, '10000', 1)).toBe('8000');
  });

  it('retorna retail cuando tipo_cliente_id es null', () => {
    const tarifas = [{ tipoClienteId: 1, precio: '8000', vigente: true }];
    expect(calcularPrecioCliente(tarifas, '10000', null)).toBe('10000');
  });

  it('retorna retail cuando la tarifa está no vigente', () => {
    const tarifas = [{ tipoClienteId: 1, precio: '8000', vigente: false }];
    expect(calcularPrecioCliente(tarifas, '10000', 1)).toBe('10000');
  });

  it('retorna retail cuando el tipo no está en tarifas', () => {
    const tarifas = [{ tipoClienteId: 2, precio: '8000', vigente: true }];
    expect(calcularPrecioCliente(tarifas, '10000', 99)).toBe('10000');
  });

  it('lista vacía retorna retail', () => {
    expect(calcularPrecioCliente([], '5000', 1)).toBe('5000');
  });
});
