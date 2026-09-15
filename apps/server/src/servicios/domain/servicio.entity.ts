export type TipoServicio = 'nacional' | 'internacional_ms' | 'internacional_courier' | 'apartado_postal';

export interface ServicioEntity {
  id:                    number;
  codigo:                string;
  nombre:                string;
  descripcion:           string | null;
  tipo:                  TipoServicio;
  requiereEstampilla:    boolean;
  requiereDimensiones:   boolean;
  requiereValorDeclarado: boolean;
  pesoMaximoKg:          number | null;
  factorVolumetrico:     number;
  tiempoEntregaDias:     number | null;
  codigoSigma:           string | null;
  tarifaCertificacion:   number | null;
  minimoSeguroPostal:    number | null;
  altoMaxCm:             number | null;
  anchoMaxCm:            number | null;
  largoMaxCm:            number | null;
  activo:                boolean;
  createdAt:             Date;
}

export interface ServicioSucursalEntity {
  sucursalId: number;
  servicioId: number;
  activo:     boolean;
  sucursal:   { id: number; codigo: string; nombre: string } | null;
}

export interface TarifaEnvioEntity {
  id:                number;
  servicioId:        number;
  paisDestino:       string;
  ciudadDestino:     string | null;
  pesoMinKg:         number;
  pesoMaxKg:         number | null;
  tarifa:            number;
  tarifaKgAdicional: number | null;
  activa:            boolean;
  vigenciaInicio:    Date | null;
  vigenciaFin:       Date | null;
}
