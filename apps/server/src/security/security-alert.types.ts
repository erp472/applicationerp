export type MitreTechnique =
  | 'T1110'
  | 'T1110.001'
  | 'T1078'
  | 'T1548'
  | 'T1562'
  | 'T1530';

export type NistCsfControl =
  | 'DE.CM-6'
  | 'DE.CM-7'
  | 'DE.AE-2'
  | 'DE.AE-3'
  | 'PR.AA-5'
  | 'RS.MA-1';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Catálogo CBS — cuarto tipo de transacción (ciberseguridad), en paralelo a ADM/OPE/FIN.
 *  Cada código fija su técnica MITRE ATT&CK, su control NIST CSF v2 y su severidad, de modo
 *  que la regla de detección no pueda emitir una combinación distinta a la documentada. */
export const CBS_CATALOG = {
  'CBS-01': {
    evento:    'Fuerza bruta de autenticación',
    mitre:     'T1110.001',
    nist_csf:  'DE.CM-7',
    severidad: 'CRITICAL',
  },
  'CBS-02': {
    evento:    'Abuso de acceso denegado',
    mitre:     'T1562',
    nist_csf:  'DE.AE-3',
    severidad: 'HIGH',
  },
  'CBS-03': {
    evento:    'Acceso masivo a datos',
    mitre:     'T1530',
    nist_csf:  'DE.CM-6',
    severidad: 'MEDIUM',
  },
  'CBS-04': {
    evento:    'Operación financiera en horario anómalo',
    mitre:     'T1078',
    nist_csf:  'DE.AE-2',
    severidad: 'HIGH',
  },
  'CBS-05': {
    evento:    'Oleada de errores desde una IP',
    mitre:     'T1078',
    nist_csf:  'DE.AE-3',
    severidad: 'MEDIUM',
  },
} as const satisfies Record<
  string,
  { evento: string; mitre: MitreTechnique; nist_csf: NistCsfControl; severidad: AlertSeverity }
>;

export type CbsCode = keyof typeof CBS_CATALOG;

export interface SecurityAlert {
  id:          string;
  /** Código propio de la alerta. Su prefijo es el tipo de transacción: CBS. */
  audit_key:   CbsCode;
  mitre:       MitreTechnique;
  nist_csf:    NistCsfControl;
  severidad:   AlertSeverity;
  descripcion: string;
  ip?:         string;
  usuario_id?: number;
  /** Código del evento de negocio que disparó la regla (ADM/OPE/FIN), si lo hubo. */
  origen_audit_key?: string;
  timestamp:   Date;
  metadata?:   Record<string, unknown>;
}
