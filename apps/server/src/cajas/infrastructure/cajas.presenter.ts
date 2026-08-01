import type {
  CajaEntity,
  CajaPadreEntity,
  SesionCajaEntity,
  MovimientoCajaEntity,
  ConsignacionEntity,
  StatusPunto,
  CardAuxiliar,
  PanelPunto,
} from '../domain/caja.entity.js';

export class CajasPresenter {
  static toCaja(entity: CajaEntity) {
    return {
      id:           entity.id,
      sucursalId:   entity.sucursalId,
      cajaPadreId:  entity.cajaPadreId,
      codigo:       entity.codigo,
      nombre:       entity.nombre,
      tipo:         entity.tipo,
      baseDia:      entity.baseDia,
      limiteAlerta: entity.limiteAlerta,
      activo:       entity.activo,
    };
  }

  static toCajaPadre(entity: CajaPadreEntity) {
    return {
      id:          entity.id,
      sucursalId:  entity.sucursalId,
      nombre:      entity.nombre,
      baseGeneral: entity.baseGeneral,
      horaReset:   entity.horaReset?.toISOString() ?? null,
    };
  }

  static toSesion(entity: SesionCajaEntity) {
    return {
      id:                entity.id,
      cajaId:            entity.cajaId,
      usuarioAperturaId: entity.usuarioAperturaId,
      cajeroAsignadoId:  entity.cajeroAsignadoId ?? null,
      montoApertura:     entity.montoApertura,
      montoCierre:       entity.montoCierre,
      fechaApertura:     entity.fechaApertura.toISOString(),
      fechaCierre:       entity.fechaCierre?.toISOString() ?? null,
      estado:            entity.estado,
      observaciones:     entity.observaciones ?? null,
      saldoActual:       entity.saldoActual ?? null,
      alertas:           entity.alertas ?? [],
    };
  }

  static toMovimiento(entity: MovimientoCajaEntity) {
    return {
      id:             entity.id,
      sesionCajaId:   entity.sesionCajaId,
      tipo:           entity.tipo,
      monto:          entity.monto,
      medioPago:      entity.medioPago,
      referenciaId:   entity.referenciaId,
      referenciaTipo: entity.referenciaTipo,
      descripcion:    entity.descripcion,
      createdAt:      entity.createdAt.toISOString(),
    };
  }

  static toConsignacion(entity: ConsignacionEntity) {
    return {
      id:              entity.id,
      sesionCajaId:    entity.sesionCajaId,
      medio:           entity.medio,
      bancoNombre:     entity.bancoNombre,
      monto:           entity.monto,
      estado:          entity.estado,
      fechaAprobacion: entity.fechaAprobacion?.toISOString() ?? null,
      createdAt:       entity.createdAt.toISOString(),
    };
  }

  static toCard(card: CardAuxiliar) {
    return {
      cajaId:        card.cajaId,
      sesionId:      card.sesionId,
      codigo:        card.codigo,
      nombre:        card.nombre,
      tipo:          card.tipo,
      cajeroId:      card.cajeroId,
      estado:        card.estado,
      saldoActual:   card.saldoActual,
      baseDia:       card.baseDia,
      limiteAlerta:  card.limiteAlerta,
      ingresosSesion: card.ingresosSesion,
      egresosSesion:  card.egresosSesion,
      girosCount:    card.girosCount,
      girosValor:    card.girosValor,
      alertas:       card.alertas,
    };
  }

  static toPanel(panel: PanelPunto) {
    return panel;
  }

  static toStatus(status: StatusPunto) {
    return {
      sucursalId:  status.sucursalId,
      cajaPadreId: status.cajaPadreId,
      panel:       CajasPresenter.toPanel(status.panel),
      cajas:       status.cajas.map(CajasPresenter.toCard),
    };
  }
}
