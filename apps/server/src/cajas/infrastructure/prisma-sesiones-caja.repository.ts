import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ISesionesCajaRepository, CrearSesionData, CerrarSesionData, RegistrarMovimientoData, CrearReposicionData, CrearConsignacionData, AprobarConsignacionData, CrearDiferenciaData, AprobarDiferenciaData } from '../domain/sesion-caja.repository.js';
import type {
  SesionCajaEntity,
  MovimientoCajaEntity,
  ConsignacionEntity,
  ReposicionCajaEntity,
  DiferenciaCajaEntity,
  CardAuxiliar,
  StatusPunto,
  TipoAlerta,
} from '../domain/caja.entity.js';
import { evaluarAlertas, TIPOS_MOVIMIENTO_ENTRADA, TIPOS_MOVIMIENTO_SALIDA } from '../domain/business-rules.js';
import { calcularSaldoPorMedioPago } from '../domain/calculos/saldo-por-medio-pago.js';
import { componerPanelStatus } from '../domain/calculos/panel-status-punto.js';
import { evaluarHoraReset } from '../domain/calculos/hora-reset.js';

const SELECT_SESION = {
  idsesiones_caja:                            true,
  cajas_idcajas:                              true,
  usuarios_idusuarios_apertura:               true,
  usuarios_idusuarios_cierre:                 true,
  usuarios_idusuarios_cajero_asignado:        true,
  equipo_macsesiones_caja:                    true,
  monto_aperturasesiones_caja:                true,
  monto_cierrasesiones_caja:                  true,
  fecha_aperturasesiones_caja:                true,
  fecha_cierrasesiones_caja:                  true,
  cierre_forzadosesiones_caja:                true,
  estadosesiones_caja:                        true,
  observacionessesiones_caja:                 true,
  arqueo_denominacionessesiones_caja:         true,
} satisfies Prisma.SesionCajaSelect;

type SesionRow = Prisma.SesionCajaGetPayload<{ select: typeof SELECT_SESION }>;

function toSesionEntity(row: SesionRow): SesionCajaEntity {
  return {
    id:                 row.idsesiones_caja,
    cajaId:             row.cajas_idcajas,
    usuarioAperturaId:  row.usuarios_idusuarios_apertura,
    usuarioCierreId:    row.usuarios_idusuarios_cierre,
    cajeroAsignadoId:   row.usuarios_idusuarios_cajero_asignado,
    equipoMac:          row.equipo_macsesiones_caja,
    montoApertura:      row.monto_aperturasesiones_caja.toString(),
    montoCierre:        row.monto_cierrasesiones_caja?.toString() ?? null,
    fechaApertura:      row.fecha_aperturasesiones_caja,
    fechaCierre:        row.fecha_cierrasesiones_caja,
    cierreForzado:      row.cierre_forzadosesiones_caja,
    estado:             row.estadosesiones_caja as SesionCajaEntity['estado'],
    observaciones:      row.observacionessesiones_caja,
  };
}

const SELECT_MOV = {
  idmovimientos_caja:              true,
  sesiones_caja_idsesiones_caja:   true,
  tipomovimientos_caja:            true,
  montomovimientos_caja:           true,
  medio_pagomovimientos_caja:      true,
  referencia_idmovimientos_caja:   true,
  referencia_tipomovimientos_caja: true,
  descripcionmovimientos_caja:     true,
  created_atmovimientos_caja:      true,
} satisfies Prisma.MovimientoCajaSelect;

type MovRow = Prisma.MovimientoCajaGetPayload<{ select: typeof SELECT_MOV }>;

function toMovEntity(row: MovRow): MovimientoCajaEntity {
  return {
    id:             row.idmovimientos_caja,
    sesionCajaId:   row.sesiones_caja_idsesiones_caja,
    tipo:           row.tipomovimientos_caja as MovimientoCajaEntity['tipo'],
    monto:          row.montomovimientos_caja.toString(),
    medioPago:      row.medio_pagomovimientos_caja as MovimientoCajaEntity['medioPago'],
    referenciaId:   row.referencia_idmovimientos_caja,
    referenciaTipo: row.referencia_tipomovimientos_caja,
    descripcion:    row.descripcionmovimientos_caja,
    createdAt:      row.created_atmovimientos_caja,
  };
}

const SELECT_CONSIG = {
  idconsignaciones:               true,
  sesiones_caja_idsesiones_caja:  true,
  usuarios_idusuarios:            true,
  medioconsignaciones:            true,
  banco_nombreconsignaciones:     true,
  tipo_cuentaconsignaciones:      true,
  numero_cuentaconsignaciones:    true,
  montoconsignaciones:            true,
  propositoconsignaciones:        true,
  soporte_urlconsignaciones:      true,
  estadoconsignaciones:           true,
  usuarios_idusuarios_aprobador:  true,
  fecha_aprobacionconsignaciones: true,
  created_atconsignaciones:       true,
} satisfies Prisma.ConsignacionSelect;

type ConsigRow = Prisma.ConsignacionGetPayload<{ select: typeof SELECT_CONSIG }>;

function toConsigEntity(row: ConsigRow): ConsignacionEntity {
  return {
    id:               row.idconsignaciones,
    sesionCajaId:     row.sesiones_caja_idsesiones_caja,
    usuarioId:        row.usuarios_idusuarios,
    medio:            row.medioconsignaciones as ConsignacionEntity['medio'],
    bancoNombre:      row.banco_nombreconsignaciones,
    tipoCuenta:       row.tipo_cuentaconsignaciones as ConsignacionEntity['tipoCuenta'],
    numeroCuenta:     row.numero_cuentaconsignaciones,
    monto:            row.montoconsignaciones.toString(),
    proposito:        row.propositoconsignaciones,
    soporteUrl:       row.soporte_urlconsignaciones,
    estado:           row.estadoconsignaciones as ConsignacionEntity['estado'],
    aprobadorId:      row.usuarios_idusuarios_aprobador,
    fechaAprobacion:  row.fecha_aprobacionconsignaciones,
    createdAt:        row.created_atconsignaciones,
  };
}

@Injectable()
export class PrismaSesionesCajaRepository implements ISesionesCajaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<SesionCajaEntity | null> {
    const row = await this.prisma.sesionCaja.findFirst({
      where: { idsesiones_caja: id },
      select: SELECT_SESION,
    });
    return row ? toSesionEntity(row) : null;
  }

  async findAbiertaByCaja(cajaId: number): Promise<SesionCajaEntity | null> {
    const row = await this.prisma.sesionCaja.findFirst({
      where: { cajas_idcajas: cajaId, estadosesiones_caja: 'abierta' },
      select: SELECT_SESION,
    });
    return row ? toSesionEntity(row) : null;
  }

  async findAbiertaByCajero(cajeroId: number): Promise<SesionCajaEntity | null> {
    const row = await this.prisma.sesionCaja.findFirst({
      where: {
        usuarios_idusuarios_cajero_asignado: cajeroId,
        estadosesiones_caja: 'abierta',
      },
      select: SELECT_SESION,
    });
    return row ? toSesionEntity(row) : null;
  }

  async findAbiertasByPunto(cajaPadreId: number): Promise<SesionCajaEntity[]> {
    const rows = await this.prisma.sesionCaja.findMany({
      where: {
        estadosesiones_caja: 'abierta',
        caja: { cajas_padres_idcajas_padres: cajaPadreId },
      },
      select: SELECT_SESION,
    });
    return rows.map(toSesionEntity);
  }

  async calcularSaldo(sesionId: number): Promise<string> {
    const sesion = await this.prisma.sesionCaja.findUniqueOrThrow({
      where: { idsesiones_caja: sesionId },
      select: {
        monto_aperturasesiones_caja: true,
        movimientosCaja: { select: { tipomovimientos_caja: true, montomovimientos_caja: true } },
      },
    });

    let saldo = Number(sesion.monto_aperturasesiones_caja);
    for (const m of sesion.movimientosCaja) {
      const monto = Number(m.montomovimientos_caja);
      if (TIPOS_MOVIMIENTO_ENTRADA.has(m.tipomovimientos_caja)) saldo += monto;
      else if (TIPOS_MOVIMIENTO_SALIDA.has(m.tipomovimientos_caja)) saldo -= monto;
    }
    return saldo.toFixed(2);
  }

  async calcularCajaGeneral(sucursalId: number): Promise<{ general: string; pagos: string }> {
    const sesiones = await this.prisma.sesionCaja.findMany({
      where: {
        estadosesiones_caja: 'abierta',
        caja: { sucursales_idsucursales: sucursalId },
      },
      select: {
        idsesiones_caja: true,
        caja: { select: { tipocajas: true } },
        monto_aperturasesiones_caja: true,
        movimientosCaja: { select: { tipomovimientos_caja: true, montomovimientos_caja: true } },
      },
    });

    let general = 0;
    let pagos = 0;
    for (const s of sesiones) {
      let saldo = Number(s.monto_aperturasesiones_caja);
      for (const m of s.movimientosCaja) {
        const monto = Number(m.montomovimientos_caja);
        if (TIPOS_MOVIMIENTO_ENTRADA.has(m.tipomovimientos_caja)) saldo += monto;
        else if (TIPOS_MOVIMIENTO_SALIDA.has(m.tipomovimientos_caja)) saldo -= monto;
      }
      if (s.caja.tipocajas === 'pagos') pagos += saldo;
      else general += saldo;
    }
    return { general: general.toFixed(2), pagos: pagos.toFixed(2) };
  }

  async crearSesion(data: CrearSesionData): Promise<SesionCajaEntity> {
    const row = await this.prisma.sesionCaja.create({
      data: {
        cajas_idcajas:                             data.cajaId,
        usuarios_idusuarios_apertura:              data.usuarioAperturaId,
        usuarios_idusuarios_cajero_asignado:       data.cajeroAsignadoId,
        equipo_macsesiones_caja:                   data.equipoMac,
        monto_aperturasesiones_caja:               data.montoApertura,
      },
      select: SELECT_SESION,
    });
    return toSesionEntity(row);
  }

  async cerrarSesion(sesionId: number, data: CerrarSesionData): Promise<SesionCajaEntity> {
    const row = await this.prisma.sesionCaja.update({
      where: { idsesiones_caja: sesionId },
      data: {
        usuarios_idusuarios_cierre:           data.usuarioCierreId,
        monto_cierrasesiones_caja:            data.montoCierre,
        fecha_cierrasesiones_caja:            new Date(),
        cierre_forzadosesiones_caja:          data.forzado ?? false,
        estadosesiones_caja:                  data.forzado ? 'forzada' : 'cerrada',
        observacionessesiones_caja:           data.observaciones,
        arqueo_denominacionessesiones_caja:   data.arqueo ? (data.arqueo as object) : undefined,
      },
      select: SELECT_SESION,
    });
    return toSesionEntity(row);
  }

  async registrarMovimiento(data: RegistrarMovimientoData): Promise<MovimientoCajaEntity> {
    const row = await this.prisma.movimientoCaja.create({
      data: {
        sesiones_caja_idsesiones_caja:   data.sesionCajaId,
        tipomovimientos_caja:            data.tipo,
        montomovimientos_caja:           data.monto,
        medio_pagomovimientos_caja:      data.medioPago,
        referencia_idmovimientos_caja:   data.referenciaId,
        referencia_tipomovimientos_caja: data.referenciaTipo,
        descripcionmovimientos_caja:     data.descripcion,
      },
      select: SELECT_MOV,
    });
    return toMovEntity(row);
  }

  // RNF-5.02: ambas patas de una transferencia se persisten en una única transacción ACID.
  // Si cualquiera falla, ninguna se escribe — conservación de masa garantizada.
  async registrarTransferenciaAtomica(
    salida: RegistrarMovimientoData,
    entrada: RegistrarMovimientoData,
  ): Promise<[MovimientoCajaEntity, MovimientoCajaEntity]> {
    const buildData = (d: RegistrarMovimientoData) => ({
      sesiones_caja_idsesiones_caja:   d.sesionCajaId,
      tipomovimientos_caja:            d.tipo,
      montomovimientos_caja:           d.monto,
      medio_pagomovimientos_caja:      d.medioPago,
      referencia_idmovimientos_caja:   d.referenciaId,
      referencia_tipomovimientos_caja: d.referenciaTipo,
      descripcionmovimientos_caja:     d.descripcion,
    });

    const [mov1, mov2] = await this.prisma.$transaction([
      this.prisma.movimientoCaja.create({ data: buildData(salida),  select: SELECT_MOV }),
      this.prisma.movimientoCaja.create({ data: buildData(entrada), select: SELECT_MOV }),
    ]);

    return [toMovEntity(mov1), toMovEntity(mov2)];
  }

  private readonly SELECT_REPOSICION = {
    idreposiciones_caja:                          true,
    sesiones_caja_idsesiones_caja_origen:         true,
    sesiones_caja_idsesiones_caja_destino:        true,
    montoreposiciones_caja:                       true,
    usuarios_idusuarios:                          true,
    estadoreposiciones_caja:                      true,
    motivoreposiciones_caja:                      true,
    codigo_remesareposiciones_caja:               true,
    created_atreposiciones_caja:                  true,
  } satisfies Prisma.ReposicionCajaSelect;

  private toReposicionEntity(row: Prisma.ReposicionCajaGetPayload<{ select: PrismaSesionesCajaRepository['SELECT_REPOSICION'] }>): ReposicionCajaEntity {
    return {
      id:             row.idreposiciones_caja,
      sesionOrigenId: row.sesiones_caja_idsesiones_caja_origen,
      sesionDestinoId:row.sesiones_caja_idsesiones_caja_destino,
      monto:          row.montoreposiciones_caja.toString(),
      usuarioId:      row.usuarios_idusuarios,
      estado:         row.estadoreposiciones_caja as ReposicionCajaEntity['estado'],
      motivo:         row.motivoreposiciones_caja,
      codigoRemesa:   row.codigo_remesareposiciones_caja,
      createdAt:      row.created_atreposiciones_caja,
    };
  }

  async crearReposicion(data: CrearReposicionData): Promise<ReposicionCajaEntity> {
    const row = await this.prisma.reposicionCaja.create({
      data: {
        sesiones_caja_idsesiones_caja_origen:  data.sesionOrigenId,
        sesiones_caja_idsesiones_caja_destino: data.sesionDestinoId,
        montoreposiciones_caja:                data.monto,
        usuarios_idusuarios:                   data.usuarioId,
        estadoreposiciones_caja:               data.estado,
        motivoreposiciones_caja:               data.motivo,
        codigo_remesareposiciones_caja:        data.codigoRemesa,
      },
      select: this.SELECT_REPOSICION,
    });
    return this.toReposicionEntity(row);
  }

  async findReposicionById(id: number): Promise<ReposicionCajaEntity | null> {
    const row = await this.prisma.reposicionCaja.findFirst({
      where:  { idreposiciones_caja: id },
      select: this.SELECT_REPOSICION,
    });
    return row ? this.toReposicionEntity(row) : null;
  }

  async findReposicionByCodigo(codigo: string): Promise<ReposicionCajaEntity | null> {
    const row = await this.prisma.reposicionCaja.findFirst({
      where:  { codigo_remesareposiciones_caja: codigo },
      select: this.SELECT_REPOSICION,
    });
    return row ? this.toReposicionEntity(row) : null;
  }

  async confirmarReposicion(id: number, aprobadorId: number): Promise<ReposicionCajaEntity> {
    const row = await this.prisma.reposicionCaja.update({
      where:  { idreposiciones_caja: id },
      data:   { estadoreposiciones_caja: 'confirmada', usuarios_idusuarios: aprobadorId },
      select: this.SELECT_REPOSICION,
    });
    return this.toReposicionEntity(row);
  }

  // RNF-5.02: el acredito (cambio_custodia_in) y la confirmación de la reposición
  // se persisten en una única transacción — si cualquiera falla ninguna se escribe.
  async confirmarCustodiaAtomica(
    reposicionId: number,
    movimientoEntrada: RegistrarMovimientoData,
    receptorId: number,
  ): Promise<ReposicionCajaEntity> {
    const buildData = (d: RegistrarMovimientoData) => ({
      sesiones_caja_idsesiones_caja:   d.sesionCajaId,
      tipomovimientos_caja:            d.tipo,
      montomovimientos_caja:           d.monto,
      medio_pagomovimientos_caja:      d.medioPago,
      referencia_idmovimientos_caja:   d.referenciaId,
      referencia_tipomovimientos_caja: d.referenciaTipo,
      descripcionmovimientos_caja:     d.descripcion,
    });

    const [, reposicion] = await this.prisma.$transaction([
      this.prisma.movimientoCaja.create({ data: buildData(movimientoEntrada), select: { idmovimientos_caja: true } }),
      this.prisma.reposicionCaja.update({
        where:  { idreposiciones_caja: reposicionId },
        data:   { estadoreposiciones_caja: 'confirmada', usuarios_idusuarios: receptorId },
        select: this.SELECT_REPOSICION,
      }),
    ]);

    return this.toReposicionEntity(reposicion);
  }

  async crearConsignacion(data: CrearConsignacionData): Promise<ConsignacionEntity> {
    const row = await this.prisma.consignacion.create({
      data: {
        sesiones_caja_idsesiones_caja: data.sesionCajaId,
        usuarios_idusuarios:           data.usuarioId,
        medioconsignaciones:           data.medio,
        banco_nombreconsignaciones:    data.bancoNombre,
        tipo_cuentaconsignaciones:     data.tipoCuenta,
        numero_cuentaconsignaciones:   data.numeroCuenta,
        montoconsignaciones:           data.monto,
        propositoconsignaciones:       data.proposito,
        soporte_urlconsignaciones:     data.soporteUrl,
      },
      select: SELECT_CONSIG,
    });
    return toConsigEntity(row);
  }

  async findConsignacionById(id: number): Promise<ConsignacionEntity | null> {
    const row = await this.prisma.consignacion.findFirst({
      where: { idconsignaciones: id },
      select: SELECT_CONSIG,
    });
    return row ? toConsigEntity(row) : null;
  }

  async aprobarConsignacion(id: number, data: AprobarConsignacionData): Promise<ConsignacionEntity> {
    const row = await this.prisma.consignacion.update({
      where: { idconsignaciones: id },
      data: {
        estadoconsignaciones:           data.estado,
        usuarios_idusuarios_aprobador:  data.aprobadorId,
        fecha_aprobacionconsignaciones: new Date(),
      },
      select: SELECT_CONSIG,
    });
    return toConsigEntity(row);
  }

  private readonly SELECT_DIFERENCIA = {
    iddiferencias_caja:            true,
    sesiones_caja_idsesiones_caja: true,
    tipo_diferencia:               true,
    monto_diferencia:              true,
    custodio_id:                   true,
    estado:                        true,
    aprobador_id:                  true,
    observaciones:                 true,
    created_at:                    true,
  } satisfies Prisma.DiferenciaCajaSelect;

  private toDiferenciaEntity(row: Prisma.DiferenciaCajaGetPayload<{ select: PrismaSesionesCajaRepository['SELECT_DIFERENCIA'] }>): DiferenciaCajaEntity {
    return {
      id:              row.iddiferencias_caja,
      sesionCajaId:    row.sesiones_caja_idsesiones_caja,
      tipoDiferencia:  row.tipo_diferencia as DiferenciaCajaEntity['tipoDiferencia'],
      monto:           row.monto_diferencia.toString(),
      custodioId:      row.custodio_id,
      estado:          row.estado as DiferenciaCajaEntity['estado'],
      aprobadorId:     row.aprobador_id,
      observaciones:   row.observaciones,
      createdAt:       row.created_at,
    };
  }

  async crearDiferencia(data: CrearDiferenciaData): Promise<DiferenciaCajaEntity> {
    const row = await this.prisma.diferenciaCaja.create({
      data: {
        sesiones_caja_idsesiones_caja: data.sesionCajaId,
        tipo_diferencia:               data.tipoDiferencia,
        monto_diferencia:              data.monto,
        custodio_id:                   data.custodioId,
        observaciones:                 data.observaciones,
      },
      select: this.SELECT_DIFERENCIA,
    });
    return this.toDiferenciaEntity(row);
  }

  async findDiferenciaById(id: number): Promise<DiferenciaCajaEntity | null> {
    const row = await this.prisma.diferenciaCaja.findFirst({
      where:  { iddiferencias_caja: id },
      select: this.SELECT_DIFERENCIA,
    });
    return row ? this.toDiferenciaEntity(row) : null;
  }

  async resolverDiferencia(id: number, data: AprobarDiferenciaData): Promise<DiferenciaCajaEntity> {
    const row = await this.prisma.diferenciaCaja.update({
      where:  { iddiferencias_caja: id },
      data: {
        estado:        data.estado,
        aprobador_id:  data.aprobadorId,
        observaciones: data.observaciones,
      },
      select: this.SELECT_DIFERENCIA,
    });
    return this.toDiferenciaEntity(row);
  }

  async getMovimientos(sesionId: number): Promise<MovimientoCajaEntity[]> {
    const rows = await this.prisma.movimientoCaja.findMany({
      where: { sesiones_caja_idsesiones_caja: sesionId },
      select: SELECT_MOV,
      orderBy: { created_atmovimientos_caja: 'desc' },
    });
    return rows.map(toMovEntity);
  }

  async getStatusPunto(cajaPadreId: number): Promise<StatusPunto> {
    const cajaPadre = await this.prisma.cajaPadre.findFirst({
      where: { idcajas_padres: cajaPadreId, deleted_atcajas_padres: null },
      select: {
        idcajas_padres:            true,
        sucursales_idsucursales:   true,
        base_generalcajas_padres:  true,
        hora_resetcajas_padres:    true,
        cajas: {
          where: { activocajas: true, deleted_atcajas: null },
          select: {
            idcajas:            true,
            codigocajas:        true,
            nombrecajas:        true,
            tipocajas:          true,
            base_diacajas:      true,
            limite_alertacajas: true,
            t_targetcajas:      true,
            sesiones: {
              where: { estadosesiones_caja: 'abierta' },
              take: 1,
              select: {
                idsesiones_caja:                         true,
                usuarios_idusuarios_apertura:            true,
                usuarios_idusuarios_cajero_asignado:     true,
                monto_aperturasesiones_caja:             true,
                movimientosCaja: {
                  select: { tipomovimientos_caja: true, montomovimientos_caja: true, medio_pagomovimientos_caja: true },
                },
                giros: {
                  where: { operaciongiros: 'pago' },
                  select: { monto_copgiros: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cajaPadre) {
      return {
        sucursalId:  0,
        cajaPadreId,
        panel: { baseGeneral: '0', cajaGeneral: '0', cajaFuerteGeneral: '0', basePagos: '0', cajaPagos: '0', cajaFuertePagos: '0', acumuladoMonedaCirculante: '0', tTransito: '0', debeReset: false, horaReset: null },
        cajas: [],
      };
    }

    let cajonGeneralTotal    = 0;  // total operativo del punto (general + pos + menor)
    let fuerteGeneralTotal   = 0;  // bóveda física: saldo sesión general + traslados mid-turn de aux
    let cajaFuertePagosTotal = 0;  // C6: traslados mid-turn a bóveda desde cajas de pagos
    let cajonPagosTotal      = 0;
    let basePagos            = '0';
    let acumuladoMoneda      = 0;

    const cards: CardAuxiliar[] = cajaPadre.cajas.map((caja) => {
      const sesionActiva = caja.sesiones[0] ?? null;

      if (!sesionActiva) {
        return {
          cajaId:       caja.idcajas,
          sesionId:     null,
          codigo:       caja.codigocajas,
          nombre:       caja.nombrecajas,
          tipo:         caja.tipocajas as import('../domain/caja.entity.js').TipoCaja,
          cajeroId:     null,
          estado:       'sin_sesion' as const,
          saldoActual:  null,
          baseDia:      caja.base_diacajas.toString(),
          limiteAlerta: caja.limite_alertacajas?.toString() ?? null,
          tTarget:      caja.t_targetcajas?.toString() ?? null,
          deltaReposicion: null,
          ingresosSesion:    '0',
          egresosSesion:     '0',
          saldoPorMedioPago: calcularSaldoPorMedioPago([]),
          girosCount:    0,
          girosValor:    '0',
          alertas:       [],
        };
      }

      let saldo            = Number(sesionActiva.monto_aperturasesiones_caja);
      let ingresos         = 0;
      let egresos          = 0;
      let monedaCirculante = 0;
      let trasladoVault    = 0;  // C5/C6: efectivo físicamente trasladado a bóveda mid-turn

      for (const m of sesionActiva.movimientosCaja) {
        const monto = Number(m.montomovimientos_caja);
        if (TIPOS_MOVIMIENTO_ENTRADA.has(m.tipomovimientos_caja)) { saldo += monto; ingresos += monto; }
        else if (TIPOS_MOVIMIENTO_SALIDA.has(m.tipomovimientos_caja)) { saldo -= monto; egresos += monto; }
        if (m.tipomovimientos_caja === 'moneda_circulante') monedaCirculante += monto;
        if (m.tipomovimientos_caja === 'traslado_caja_fuerte') trasladoVault += monto;
      }

      // RF-3.02: excluir movimientos neutros (ej. 'apertura') que no son entrada ni salida.
      // Incluirlos con esEntrada=false haría que restaran de efectivo incorrectamente.
      const saldoPorMedioPago = calcularSaldoPorMedioPago(
        sesionActiva.movimientosCaja
          .filter(m =>
            TIPOS_MOVIMIENTO_ENTRADA.has(m.tipomovimientos_caja) ||
            TIPOS_MOVIMIENTO_SALIDA.has(m.tipomovimientos_caja),
          )
          .map(m => ({
            medioPago:  m.medio_pagomovimientos_caja ?? undefined,
            monto:      m.montomovimientos_caja.toString(),
            esEntrada:  TIPOS_MOVIMIENTO_ENTRADA.has(m.tipomovimientos_caja),
          })),
      );

      acumuladoMoneda += monedaCirculante;

      const girosCount = sesionActiva.giros.length;
      const girosValor = sesionActiva.giros.reduce((acc, g) => acc + Number(g.monto_copgiros), 0);

      const baseDia     = caja.base_diacajas.toString();
      const limiteAlerta = caja.limite_alertacajas?.toString() ?? null;
      const tTarget     = caja.t_targetcajas?.toString() ?? null;
      const alertas: TipoAlerta[] = evaluarAlertas(saldo.toFixed(2), baseDia, limiteAlerta);
      // RF-2.01: ΔQ = T_target − B_i(t), solo cuando hay alerta de reposición y tTarget está configurado
      const deltaReposicion = (alertas.includes('reposicion_caja') && tTarget)
        ? Math.max(0, Number(tTarget) - saldo).toFixed(2)
        : null;

      if (caja.tipocajas === 'pagos') {
        cajonPagosTotal      += saldo;
        cajaFuertePagosTotal += trasladoVault;  // C6: acumula lo trasladado a bóveda desde pagos
        basePagos = baseDia;
      } else if (caja.tipocajas === 'general') {
        // La sesión 'general' ES la bóveda física del punto.
        // Su saldo incluye cambio_custodia_in de auxiliares ya cerradas (vía TIPOS_ENTRADA).
        cajonGeneralTotal  += saldo;
        fuerteGeneralTotal += saldo;
      } else {
        // pos, menor → cajón operativo del cajero auxiliar
        cajonGeneralTotal  += saldo;
        // C5: traslados mid-turn de aux → ya están en la bóveda física aunque la aux sigue abierta
        fuerteGeneralTotal += trasladoVault;
      }

      return {
        cajaId:        caja.idcajas,
        sesionId:      sesionActiva.idsesiones_caja,
        codigo:        caja.codigocajas,
        nombre:        caja.nombrecajas,
        tipo:          caja.tipocajas as import('../domain/caja.entity.js').TipoCaja,
        cajeroId:      sesionActiva.usuarios_idusuarios_cajero_asignado ?? sesionActiva.usuarios_idusuarios_apertura,
        estado:        'abierta' as const,
        saldoActual:   saldo.toFixed(2),
        baseDia,
        limiteAlerta,
        tTarget,
        deltaReposicion,
        ingresosSesion:    ingresos.toFixed(2),
        egresosSesion:     egresos.toFixed(2),
        saldoPorMedioPago,
        girosCount,
        girosValor:    girosValor.toFixed(2),
        alertas,
      };
    });

    // RF-4.01: T_transito — efectivo en tránsito entre cajas del punto
    const sesionIdsDelPunto = cajaPadre.cajas
      .flatMap(c => c.sesiones.map(s => s.idsesiones_caja));

    const transitoAgg = sesionIdsDelPunto.length > 0
      ? await this.prisma.reposicionCaja.aggregate({
          where: {
            estadoreposiciones_caja: 'en_transito',
            sesiones_caja_idsesiones_caja_origen: { in: sesionIdsDelPunto },
          },
          _sum: { montoreposiciones_caja: true },
        })
      : null;

    const tTransito = (transitoAgg?._sum?.montoreposiciones_caja ?? 0).toString();

    return {
      sucursalId:  cajaPadre.sucursales_idsucursales,
      cajaPadreId: cajaPadre.idcajas_padres,
      panel: (() => {
        const horaResetDb = cajaPadre.hora_resetcajas_padres;
        const horaResetStr = horaResetDb
          ? `${String(horaResetDb.getHours()).padStart(2, '0')}:${String(horaResetDb.getMinutes()).padStart(2, '0')}`
          : null;
        const ahora = new Date();
        const horaAhora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        const { debeResetear } = horaResetStr
          ? evaluarHoraReset(horaAhora, horaResetStr)
          : { debeResetear: false };
        return componerPanelStatus(
          cajaPadre.base_generalcajas_padres.toString(),
          cajonGeneralTotal.toFixed(2),
          fuerteGeneralTotal.toFixed(2),
          basePagos,
          cajonPagosTotal.toFixed(2),
          cajaFuertePagosTotal.toFixed(2),
          acumuladoMoneda.toFixed(2),
          tTransito,
          debeResetear,
          horaResetStr,
        );
      })(),
      cajas: cards,
    };
  }

  async updateCajeroAsignado(sesionId: number, cajeroId: number | null): Promise<SesionCajaEntity> {
    const row = await this.prisma.sesionCaja.update({
      where:  { idsesiones_caja: sesionId },
      data:   { usuarios_idusuarios_cajero_asignado: cajeroId },
      select: SELECT_SESION,
    });
    return toSesionEntity(row);
  }

  async getConsolidadoPorRegional(): Promise<{ regionalId: number; porMedio: Record<string, string> }[]> {
    // Traverse the working hierarchy: cajaPadre → cajas → sesiones(abierta) → movimientosCaja
    const padres = await this.prisma.cajaPadre.findMany({
      where: { deleted_atcajas_padres: null },
      select: {
        sucursales_idsucursales: true,
        cajas: {
          where: { deleted_atcajas: null },
          select: {
            sesiones: {
              where: { estadosesiones_caja: 'abierta' },
              select: {
                movimientosCaja: {
                  where: { tipomovimientos_caja: { in: [...TIPOS_MOVIMIENTO_ENTRADA] as any[] } },
                  select: {
                    montomovimientos_caja:      true,
                    medio_pagomovimientos_caja: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get regional for each sucursal
    const sucursalIds = [...new Set(padres.map(p => p.sucursales_idsucursales))];
    const sucursales = await this.prisma.sucursal.findMany({
      where:  { idsucursales: { in: sucursalIds }, deleted_atsucursales: null },
      select: { idsucursales: true, regionales_idregionales: true },
    });
    const sucursalToRegional = new Map(sucursales.map(s => [s.idsucursales, s.regionales_idregionales]));

    const byRegional = new Map<number, Record<string, number>>();
    for (const padre of padres) {
      const regionalId = sucursalToRegional.get(padre.sucursales_idsucursales);
      if (!regionalId) continue;
      if (!byRegional.has(regionalId)) byRegional.set(regionalId, {});
      const entry = byRegional.get(regionalId)!;
      for (const caja of padre.cajas) {
        for (const sesion of caja.sesiones) {
          for (const m of sesion.movimientosCaja) {
            const medio = (m.medio_pagomovimientos_caja as string | null) ?? 'efectivo';
            entry[medio] = (entry[medio] ?? 0) + Number(m.montomovimientos_caja);
          }
        }
      }
    }

    return Array.from(byRegional.entries()).map(([regionalId, totales]) => ({
      regionalId,
      porMedio: Object.fromEntries(Object.entries(totales).map(([k, v]) => [k, v.toFixed(2)])),
    }));
  }
}
