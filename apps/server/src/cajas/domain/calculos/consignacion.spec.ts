import { describe, it, expect } from 'vitest';
import {
  registrarConsignacion,
  buildImpactoConsignacionAprobada,
  rechazarConsignacion,
  validarMontoConsignacion,
} from './consignacion.js';

describe('registrarConsignacion', () => {
  it('caso normal', () => {
    const result = registrarConsignacion('500000', 'REF-001', '1000000');
    expect(result.monto).toBe('500000');
    expect(result.referencia).toBe('REF-001');
    expect(result.estado).toBe('pendiente');
  });

  it('monto exactamente igual al saldo', () => {
    const result = registrarConsignacion('1000000', 'REF-002', '1000000');
    expect(result.estado).toBe('pendiente');
  });

  it('recorta espacios de la referencia', () => {
    const result = registrarConsignacion('200000', '  REF-TRIM  ', '500000');
    expect(result.referencia).toBe('REF-TRIM');
  });

  it('monto cero lanza error', () => {
    expect(() => registrarConsignacion('0', 'REF', '500000')).toThrow('mayor a cero');
  });

  it('monto negativo lanza error', () => {
    expect(() => registrarConsignacion('-100', 'REF', '500000')).toThrow('mayor a cero');
  });

  it('monto supera saldo lanza error', () => {
    expect(() => registrarConsignacion('600000', 'REF', '500000')).toThrow('saldo de sesión');
  });

  it('referencia vacía lanza error', () => {
    expect(() => registrarConsignacion('100000', '', '500000')).toThrow('obligatoria');
  });

  it('referencia solo espacios lanza error', () => {
    expect(() => registrarConsignacion('100000', '   ', '500000')).toThrow('obligatoria');
  });
});

describe('buildImpactoConsignacionAprobada', () => {
  it('payload correcto', () => {
    const fecha = new Date('2025-03-15T10:30:00Z');
    const result = buildImpactoConsignacionAprobada('300000', 42, fecha);
    expect(result.monto).toBe('300000');
    expect(result.sesionCajaId).toBe(42);
    expect(result.tipoMovimiento).toBe('consignacion');
    expect(result.esEntrada).toBe(false);
    expect(result.estado).toBe('aprobada');
    expect(result.fechaAprobacion).toBe('2025-03-15T10:30:00');
  });

  it('monto alto', () => {
    const fecha = new Date('2025-06-01T08:00:00Z');
    const result = buildImpactoConsignacionAprobada('9999999', 1, fecha);
    expect(result.monto).toBe('9999999');
    expect(result.esEntrada).toBe(false);
  });
});

describe('rechazarConsignacion', () => {
  it('rechaza consignación pendiente', () => {
    const result = rechazarConsignacion('pendiente', 'Referencia no coincide con banco');
    expect(result.estado).toBe('rechazada');
    expect(result.motivoRechazo).toBe('Referencia no coincide con banco');
    expect(result.alertaCajero).toBe(true);
  });

  it('recorta espacios del motivo', () => {
    const result = rechazarConsignacion('pendiente', '  Monto errado  ');
    expect(result.motivoRechazo).toBe('Monto errado');
  });

  it('estado aprobada lanza error', () => {
    expect(() => rechazarConsignacion('aprobada', 'Motivo')).toThrow('pendiente');
  });

  it('estado rechazada lanza error', () => {
    expect(() => rechazarConsignacion('rechazada', 'Motivo')).toThrow('pendiente');
  });

  it('motivo vacío lanza error', () => {
    expect(() => rechazarConsignacion('pendiente', '')).toThrow('obligatorio');
  });

  it('motivo solo espacios lanza error', () => {
    expect(() => rechazarConsignacion('pendiente', '   ')).toThrow('obligatorio');
  });
});

describe('validarMontoConsignacion', () => {
  it('caso normal retorna undefined', () => {
    expect(validarMontoConsignacion('500000', '1000000')).toBeUndefined();
  });

  it('monto igual al saldo es válido', () => {
    expect(validarMontoConsignacion('750000', '750000')).toBeUndefined();
  });

  it('monto cero lanza error', () => {
    expect(() => validarMontoConsignacion('0', '1000000')).toThrow('mayor a cero');
  });

  it('monto negativo lanza error', () => {
    expect(() => validarMontoConsignacion('-500', '1000000')).toThrow('mayor a cero');
  });

  it('monto supera saldo lanza error', () => {
    expect(() => validarMontoConsignacion('1000001', '1000000')).toThrow('supera el saldo');
  });
});
