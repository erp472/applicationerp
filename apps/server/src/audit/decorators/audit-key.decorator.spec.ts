import { describe, it, expect } from 'vitest';
import { AUDIT_KEY_METADATA, AuditKey, type AuditKeyMeta } from './audit-key.decorator.js';
import { Reflector } from '@nestjs/core';

describe('AuditKey decorator', () => {
  it('extrae tipo ADM de código ADM-01', () => {
    const target = {};
    const descriptor = { value: () => {} };
    AuditKey('ADM-01')(target, 'method', descriptor);
    const meta: AuditKeyMeta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
    expect(meta.codigo).toBe('ADM-01');
    expect(meta.tipo).toBe('ADM');
  });

  it('extrae tipo OPE de código OPE-03', () => {
    const target = {};
    const descriptor = { value: () => {} };
    AuditKey('OPE-03')(target, 'method', descriptor);
    const meta: AuditKeyMeta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
    expect(meta.codigo).toBe('OPE-03');
    expect(meta.tipo).toBe('OPE');
  });

  it('extrae tipo FIN de código FIN-01', () => {
    const target = {};
    const descriptor = { value: () => {} };
    AuditKey('FIN-01')(target, 'method', descriptor);
    const meta: AuditKeyMeta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
    expect(meta.codigo).toBe('FIN-01');
    expect(meta.tipo).toBe('FIN');
  });

  it('aplica metadatos con la clave correcta', () => {
    const target = {};
    const descriptor = { value: () => {} };
    AuditKey('ADM-08')(target, 'method', descriptor);
    const meta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
    expect(meta).toBeDefined();
    expect(meta).toHaveProperty('codigo');
    expect(meta).toHaveProperty('tipo');
  });

  it('todos los códigos ADM tienen tipo ADM', () => {
    const codigosAdm = ['ADM-01','ADM-02','ADM-03','ADM-04','ADM-05','ADM-06','ADM-07','ADM-08','ADM-09'];
    for (const codigo of codigosAdm) {
      const descriptor = { value: () => {} };
      AuditKey(codigo)({}, 'm', descriptor);
      const meta: AuditKeyMeta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
      expect(meta.tipo).toBe('ADM');
    }
  });

  it('todos los códigos OPE tienen tipo OPE', () => {
    const codigosOpe = ['OPE-01','OPE-02','OPE-03','OPE-04','OPE-05','OPE-06','OPE-07'];
    for (const codigo of codigosOpe) {
      const descriptor = { value: () => {} };
      AuditKey(codigo)({}, 'm', descriptor);
      const meta: AuditKeyMeta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
      expect(meta.tipo).toBe('OPE');
    }
  });

  it('todos los códigos FIN tienen tipo FIN', () => {
    const codigosFin = ['FIN-01','FIN-02','FIN-03','FIN-04','FIN-05'];
    for (const codigo of codigosFin) {
      const descriptor = { value: () => {} };
      AuditKey(codigo)({}, 'm', descriptor);
      const meta: AuditKeyMeta = Reflect.getMetadata(AUDIT_KEY_METADATA, descriptor.value);
      expect(meta.tipo).toBe('FIN');
    }
  });
});
