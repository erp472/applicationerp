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
      id:               entity.id,
      sucursalId:       entity.sucursalId,
      nombre:           entity.nombre,
      baseGeneral:      entity.baseGeneral,
      horaReset:        entity.horaReset?.toISOString() ?? null,
      supervisorId:     entity.supervisorId     ?? null,
      supervisorNombre: entity.supervisorNombre ?? null,
      supervisorEmail:  entity.supervisorEmail  ?? null,
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
      cajeroFijoId:  card.cajeroFijoId,
      estado:        card.estado,
      saldoActual:   card.saldoActual,
      baseDia:       card.baseDia,
      limiteAlerta:  card.limiteAlerta,
      tTarget:         card.tTarget,
      deltaReposicion: card.deltaReposicion,
      ingresosSesion: card.ingresosSesion,
      egresosSesion:  card.egresosSesion,
      // saldoActual es solo efectivo: el desglose deja ver la venta no-efectivo
      // que antes se contaba dentro del cajón.
      saldoPorMedioPago: card.saldoPorMedioPago,
      girosCount:    card.girosCount,
      girosValor:    card.girosValor,
      alertas:       card.alertas,
    };
  }

  static toPanel(panel: PanelPunto) {
    return panel;
  }

  // El efectivo de la bóveda y las bases del punto son información del custodio
  // principal. Se anulan en vez de omitirse para que el panel conserve su forma y
  // el cliente solo tenga que ocultar la fila.
  static toPanelCajero(panel: PanelPunto) {
    return {
      ...panel,
      baseGeneral:               null,
      cajaGeneral:               null,
      cajaFuerteGeneral:         null,
      basePagos:                 null,
      cajaPagos:                 null,
      cajaFuertePagos:           null,
      acumuladoMonedaCirculante: null,
      tTransito:                 null,
    };
  }

  static toStatus(status: StatusPunto) {
    return {
      sucursalId:  status.sucursalId,
      cajaPadreId: status.cajaPadreId,
      panel:       CajasPresenter.toPanel(status.panel),
      cajas:       status.cajas.map(CajasPresenter.toCard),
    };
  }

  // Un cajero auxiliar solo ve su propio cajón: la caja 'general' es la bóveda y
  // queda fuera aunque él figure como cajero asignado de ella.
  static toStatusCajero(status: StatusPunto, cajeroId: number) {
    return {
      sucursalId:  status.sucursalId,
      cajaPadreId: status.cajaPadreId,
      panel:       CajasPresenter.toPanelCajero(status.panel),
      cajas:       status.cajas
        .filter(c => c.tipo !== 'general' && c.cajeroId === cajeroId)
        .map(CajasPresenter.toCard),
    };
  }
}
