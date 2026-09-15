export type TipoSaca = 'nacional' | 'internacional';
export type TipoConsolidacionSaca = 'consolidada' | 'directa';
export type EstadoSaca = 'abierta' | 'cerrada';

export interface SacaEntity {
  id:                  number;
  numeroPrecinto:      string;
  sucursalId:          number;
  sesionCajaId:        number | null;
  usuarioId:           number;
  tipo:                TipoSaca;
  tipoConsolidacion:   TipoConsolidacionSaca;
  centroOperativoDest: string | null;
  estado:              EstadoSaca;
  pesoKg:              number | null;
  totalEnvios:         number;
  transportistaNombre: string | null;
  transportistaFirma:  boolean;
  fechaDespacho:       Date | null;
  createdAt:           Date;
  cerradaAt:           Date | null;
}

export interface EnvioSacaEntity {
  id:        number;
  sacaId:    number;
  envioId:   number;
  createdAt: Date;
}
