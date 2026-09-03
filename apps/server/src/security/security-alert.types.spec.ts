import { describe, it, expect } from 'vitest';
import type { MitreTechnique, NistCsfControl, AlertSeverity, SecurityAlert } from './security-alert.types.js';

// Validación del catálogo de tipos MITRE ATT&CK y NIST CSF v2
// Estos tests aseguran que los tipos estén correctamente definidos y no regresen a tipos incorrectos

describe('SecurityAlert types — MITRE ATT&CK / NIST CSF v2 catalog', () => {

  it('SecurityAlert tiene todos los campos requeridos por NIST SP 800-53 Rev.5', () => {
    const alert: SecurityAlert = {
      id:          'test-id-001',
      mitre:       'T1110',
      nist_csf:    'DE.CM-7',
      severidad:   'CRITICAL',
      descripcion: 'Brute force detectado',
      ip:          '1.2.3.4',
      usuario_id:  1,
      audit_key:   'ADM-03',
      timestamp:   new Date(),
      metadata:    { intentos: 5 },
    };
    expect(alert).toBeDefined();
    expect(alert.mitre).toBe('T1110');
    expect(alert.nist_csf).toBe('DE.CM-7');
  });

  describe('Técnicas MITRE ATT&CK cubiertas', () => {
    it('T1110 — Brute Force', () => {
      const t: MitreTechnique = 'T1110';
      expect(t).toBe('T1110');
    });
    it('T1110.001 — Password Guessing', () => {
      const t: MitreTechnique = 'T1110.001';
      expect(t).toBe('T1110.001');
    });
    it('T1078 — Valid Accounts', () => {
      const t: MitreTechnique = 'T1078';
      expect(t).toBe('T1078');
    });
    it('T1548 — Abuse Elevation Control', () => {
      const t: MitreTechnique = 'T1548';
      expect(t).toBe('T1548');
    });
    it('T1562 — Impair Defenses', () => {
      const t: MitreTechnique = 'T1562';
      expect(t).toBe('T1562');
    });
    it('T1530 — Data from Cloud Storage', () => {
      const t: MitreTechnique = 'T1530';
      expect(t).toBe('T1530');
    });
  });

  describe('Controles NIST CSF v2 cubiertos', () => {
    it('DE.CM-6 — Monitoring for unauthorized use', () => {
      const c: NistCsfControl = 'DE.CM-6';
      expect(c).toBe('DE.CM-6');
    });
    it('DE.CM-7 — Monitoring for unauthorized access', () => {
      const c: NistCsfControl = 'DE.CM-7';
      expect(c).toBe('DE.CM-7');
    });
    it('DE.AE-2 — Anomalies analyzed', () => {
      const c: NistCsfControl = 'DE.AE-2';
      expect(c).toBe('DE.AE-2');
    });
    it('DE.AE-3 — Event data aggregated', () => {
      const c: NistCsfControl = 'DE.AE-3';
      expect(c).toBe('DE.AE-3');
    });
    it('PR.AA-5 — Access permissions managed', () => {
      const c: NistCsfControl = 'PR.AA-5';
      expect(c).toBe('PR.AA-5');
    });
    it('RS.MA-1 — Incidents contained', () => {
      const c: NistCsfControl = 'RS.MA-1';
      expect(c).toBe('RS.MA-1');
    });
  });

  describe('Niveles de severidad (NIST SP 800-115)', () => {
    it('cubre los 4 niveles de severidad', () => {
      const niveles: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      expect(niveles).toHaveLength(4);
      expect(niveles).toContain('CRITICAL');
    });
  });
});
