import { describe, it, expect } from 'vitest';
import {
  VentaNoEncontradaError,
  ClienteNoEncontradoError,
  ProductoNoEncontradoError,
  DetalleNoEncontradoError,
  SesionCajaInactivaError,
  CarritoVacioError,
  VentaYaAnuladaError,
  VentaYaConfirmadaError,
  VentaDeOtroTurnoError,
  ApartadoNoDisponibleError,
  ApartadoNoEncontradoError,
  ServicioNoEncontradoError,
  TarifaNoEncontradaError,
  StockInsuficienteError,
  CantidadMinimaError,
  CantidadMaximaError,
  CantidadFueraDeTarifaError,
  PesoExcedeLimiteError,
  EfectivoInsuficienteError,
  SaldoInsuficienteError,
  ClienteRequeridoError,
} from './venta.errors.js';

describe('Venta domain errors', () => {
  it('VentaNoEncontradaError incluye id y statusCode 404', () => {
    const e = new VentaNoEncontradaError(42);
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('42');
    expect(e.name).toBe('VentaNoEncontradaError');
  });

  it('ClienteNoEncontradoError incluye tipo y número de documento', () => {
    const e = new ClienteNoEncontradoError('CC', '12345678');
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('CC');
    expect(e.message).toContain('12345678');
    expect(e.name).toBe('ClienteNoEncontradoError');
  });

  it('ProductoNoEncontradoError incluye id y statusCode 404', () => {
    const e = new ProductoNoEncontradoError(10);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('10');
    expect(e.name).toBe('ProductoNoEncontradoError');
  });

  it('DetalleNoEncontradoError incluye id y statusCode 404', () => {
    const e = new DetalleNoEncontradoError(5);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('5');
    expect(e.name).toBe('DetalleNoEncontradoError');
  });

  it('SesionCajaInactivaError incluye cajaId y statusCode 409', () => {
    const e = new SesionCajaInactivaError(3);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('3');
    expect(e.name).toBe('SesionCajaInactivaError');
  });

  it('CarritoVacioError tiene mensaje fijo y statusCode 422', () => {
    const e = new CarritoVacioError();
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('vacío');
    expect(e.name).toBe('CarritoVacioError');
  });

  it('VentaYaAnuladaError incluye id y statusCode 409', () => {
    const e = new VentaYaAnuladaError(7);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('7');
    expect(e.name).toBe('VentaYaAnuladaError');
  });

  it('VentaYaConfirmadaError incluye id y statusCode 409', () => {
    const e = new VentaYaConfirmadaError(8);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('8');
    expect(e.name).toBe('VentaYaConfirmadaError');
  });

  it('VentaDeOtroTurnoError incluye id y statusCode 403', () => {
    const e = new VentaDeOtroTurnoError(9);
    expect(e.statusCode).toBe(403);
    expect(e.message).toContain('9');
    expect(e.name).toBe('VentaDeOtroTurnoError');
  });

  it('ApartadoNoDisponibleError incluye número y statusCode 409', () => {
    const e = new ApartadoNoDisponibleError('1234-BOG');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('1234-BOG');
    expect(e.name).toBe('ApartadoNoDisponibleError');
  });

  it('ApartadoNoEncontradoError incluye número y statusCode 404', () => {
    const e = new ApartadoNoEncontradoError('5678-MED');
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('5678-MED');
    expect(e.name).toBe('ApartadoNoEncontradoError');
  });

  it('ServicioNoEncontradoError incluye id y statusCode 404', () => {
    const e = new ServicioNoEncontradoError(2);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('2');
    expect(e.name).toBe('ServicioNoEncontradoError');
  });

  it('TarifaNoEncontradaError incluye servicioId y pesoKg con statusCode 422', () => {
    const e = new TarifaNoEncontradaError(3, 2.5);
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('3');
    expect(e.message).toContain('2.5');
    expect(e.name).toBe('TarifaNoEncontradaError');
  });

  it('StockInsuficienteError incluye nombre, disponible y solicitado con statusCode 409', () => {
    const e = new StockInsuficienteError('Estampilla 100g', 5, 10);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('Estampilla 100g');
    expect(e.message).toContain('5');
    expect(e.message).toContain('10');
    expect(e.name).toBe('StockInsuficienteError');
  });

  it('CantidadMinimaError incluye nombre y mínimo con statusCode 422', () => {
    const e = new CantidadMinimaError('Sobre carta', 5);
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('Sobre carta');
    expect(e.message).toContain('5');
    expect(e.name).toBe('CantidadMinimaError');
  });

  it('CantidadMaximaError incluye nombre y máximo con statusCode 422', () => {
    const e = new CantidadMaximaError('Sello postal', 100);
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('Sello postal');
    expect(e.message).toContain('100');
    expect(e.name).toBe('CantidadMaximaError');
  });

  it('CantidadFueraDeTarifaError incluye nombre y cantidad con statusCode 422', () => {
    const e = new CantidadFueraDeTarifaError('Paquete especial', 7);
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('Paquete especial');
    expect(e.message).toContain('7');
    expect(e.name).toBe('CantidadFueraDeTarifaError');
  });

  it('PesoExcedeLimiteError incluye pesoKg y limiteKg con statusCode 422', () => {
    const e = new PesoExcedeLimiteError(35, 30);
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('35');
    expect(e.message).toContain('30');
    expect(e.name).toBe('PesoExcedeLimiteError');
  });

  it('EfectivoInsuficienteError incluye montos formateados y statusCode 422', () => {
    const e = new EfectivoInsuficienteError(50000, 80000);
    expect(e.statusCode).toBe(422);
    expect(e.message).toMatch(/50/);
    expect(e.message).toMatch(/80/);
    expect(e.name).toBe('EfectivoInsuficienteError');
  });

  it('SaldoInsuficienteError incluye montos formateados y statusCode 422', () => {
    const e = new SaldoInsuficienteError(20000, 50000);
    expect(e.statusCode).toBe(422);
    expect(e.message).toMatch(/20/);
    expect(e.name).toBe('SaldoInsuficienteError');
  });

  it('ClienteRequeridoError tiene mensaje fijo y statusCode 422', () => {
    const e = new ClienteRequeridoError();
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('cliente identificado');
    expect(e.name).toBe('ClienteRequeridoError');
  });
});
