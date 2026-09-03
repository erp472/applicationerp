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

export interface SecurityAlert {
  id:          string;
  mitre:       MitreTechnique;
  nist_csf:    NistCsfControl;
  severidad:   AlertSeverity;
  descripcion: string;
  ip?:         string;
  usuario_id?: number;
  audit_key?:  string;
  timestamp:   Date;
  metadata?:   Record<string, unknown>;
}
