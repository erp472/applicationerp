import type { ServicioEntity, ServicioSucursalEntity } from '../domain/servicio.entity.js';

export interface ServicioResponse {
  id:                    number;
  codigo:                string;
  nombre:                string;
  descripcion:           string | null;
  tipo:                  string;
  requiereEstampilla:    boolean;
  requiereDimensiones:   boolean;
  requiereValorDeclarado: boolean;
  pesoMaximoKg:          number | null;
  factorVolumetrico:     number;
  tiempoEntregaDias:     number | null;
  codigoSigma:           string | null;
  activo:                boolean;
  createdAt:             string;
}

export interface ServicioSucursalResponse {
  sucursalId: number;
  servicioId: number;
  activo:     boolean;
  sucursal:   { id: number; codigo: string; nombre: string } | null;
}

export class ServiciosPresenter {
  static toResponse(entity: ServicioEntity): ServicioResponse {
    return {
      id:                    entity.id,
      codigo:                entity.codigo,
      nombre:                entity.nombre,
      descripcion:           entity.descripcion,
      tipo:                  entity.tipo,
      requiereEstampilla:    entity.requiereEstampilla,
      requiereDimensiones:   entity.requiereDimensiones,
      requiereValorDeclarado: entity.requiereValorDeclarado,
      pesoMaximoKg:          entity.pesoMaximoKg,
      factorVolumetrico:     entity.factorVolumetrico,
      tiempoEntregaDias:     entity.tiempoEntregaDias,
      codigoSigma:           entity.codigoSigma,
      activo:                entity.activo,
      createdAt:             entity.createdAt.toISOString(),
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
}
