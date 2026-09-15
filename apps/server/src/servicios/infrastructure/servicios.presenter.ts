import type { ServicioEntity, ServicioSucursalEntity, TarifaEnvioEntity } from '../domain/servicio.entity.js';

export interface ServicioResponse {
  id:                     number;
  codigo:                 string;
  nombre:                 string;
  descripcion:            string | null;
  tipo:                   string;
  requiereEstampilla:     boolean;
  requiereDimensiones:    boolean;
  requiereValorDeclarado: boolean;
  pesoMaximoKg:           number | null;
  factorVolumetrico:      number;
  tiempoEntregaDias:      number | null;
  codigoSigma:            string | null;
  tarifaCertificacion:    number | null;
  minimoSeguroPostal:     number | null;
  altoMaxCm:              number | null;
  anchoMaxCm:             number | null;
  largoMaxCm:             number | null;
  activo:                 boolean;
  createdAt:              string;
}

export interface ServicioSucursalResponse {
  sucursalId: number;
  servicioId: number;
  activo:     boolean;
  sucursal:   { id: number; codigo: string; nombre: string } | null;
}

export interface TarifaEnvioResponse {
  id:                number;
  servicioId:        number;
  paisDestino:       string;
  ciudadDestino:     string | null;
  pesoMinKg:         number;
  pesoMaxKg:         number | null;
  tarifa:            number;
  tarifaKgAdicional: number | null;
  activa:            boolean;
  vigenciaInicio:    string | null;
  vigenciaFin:       string | null;
}

export class ServiciosPresenter {
  static toResponse(entity: ServicioEntity): ServicioResponse {
    return {
      id:                     entity.id,
      codigo:                 entity.codigo,
      nombre:                 entity.nombre,
      descripcion:            entity.descripcion,
      tipo:                   entity.tipo,
      requiereEstampilla:     entity.requiereEstampilla,
      requiereDimensiones:    entity.requiereDimensiones,
      requiereValorDeclarado: entity.requiereValorDeclarado,
      pesoMaximoKg:           entity.pesoMaximoKg,
      factorVolumetrico:      entity.factorVolumetrico,
      tiempoEntregaDias:      entity.tiempoEntregaDias,
      codigoSigma:            entity.codigoSigma,
      tarifaCertificacion:    entity.tarifaCertificacion,
      minimoSeguroPostal:     entity.minimoSeguroPostal,
      altoMaxCm:              entity.altoMaxCm,
      anchoMaxCm:             entity.anchoMaxCm,
      largoMaxCm:             entity.largoMaxCm,
      activo:                 entity.activo,
      createdAt:              entity.createdAt.toISOString(),
    };
  }

  static toList(entities: ServicioEntity[]): ServicioResponse[] {
    return entities.map((e) => ServiciosPresenter.toResponse(e));
  }

  static toSucursalResponse(entity: ServicioSucursalEntity): ServicioSucursalResponse {
    return {
      sucursalId: entity.sucursalId,
      servicioId: entity.servicioId,
      activo:     entity.activo,
      sucursal:   entity.sucursal ?? null,
    };
  }

  static toSucursalList(entities: ServicioSucursalEntity[]): ServicioSucursalResponse[] {
    return entities.map((e) => ServiciosPresenter.toSucursalResponse(e));
  }

  static toTarifaResponse(entity: TarifaEnvioEntity): TarifaEnvioResponse {
    return {
      id:                entity.id,
      servicioId:        entity.servicioId,
      paisDestino:       entity.paisDestino,
      ciudadDestino:     entity.ciudadDestino,
      pesoMinKg:         entity.pesoMinKg,
      pesoMaxKg:         entity.pesoMaxKg,
      tarifa:            entity.tarifa,
      tarifaKgAdicional: entity.tarifaKgAdicional,
      activa:            entity.activa,
      vigenciaInicio:    entity.vigenciaInicio ? entity.vigenciaInicio.toISOString() : null,
      vigenciaFin:       entity.vigenciaFin ? entity.vigenciaFin.toISOString() : null,
    };
  }

  static toTarifaList(entities: TarifaEnvioEntity[]): TarifaEnvioResponse[] {
    return entities.map((e) => ServiciosPresenter.toTarifaResponse(e));
  }
}
