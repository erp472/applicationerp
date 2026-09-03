import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ISesionesCajaRepository, CrearSesionData, CerrarSesionData, RegistrarMovimientoData, CrearReposicionData, CrearConsignacionData, AprobarConsignacionData, CrearDiferenciaData, AprobarDiferenciaData, DiferenciasFiltros, DiferenciaRegistroItem } from '../domain/sesion-caja.repository.js';
import type {
  SesionCajaEntity,
  MovimientoCajaEntity,
  ConsignacionEntity,
  ReposicionCajaEntity,
  DiferenciaCajaEntity,
  CardAuxiliar,
  StatusPunto,
  TipoAlerta,
  BalancePagosRow,
} from '../domain/caja.entity.js';
import { evaluarAlertas, TIPOS_MOVIMIENTO_ENTRADA, TIPOS_MOVIMIENTO_SALIDA, deltaEfectivo } from '../domain/business-rules.js';
import { calcularSaldoPorMedioPago } from '../domain/calculos/saldo-por-medio-pago.js';
import { componerPanelStatus, calcularBaseDisponible } from '../domain/calculos/panel-status-punto.js';
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
  franquicias_idfranquicias:       true,
  codigo_vouchermovimientos_caja:  true,
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
    franquiciaId:   row.franquicias_idfranquicias,
    codigoVoucher:  row.codigo_vouchermovimientos_caja,
    createdAt:      row.created_atmovimientos_caja,
  };
}

function toMovData(d: RegistrarMovimientoData) {
  return {
    sesiones_caja_idsesiones_caja:   d.sesionCajaId,
    tipomovimientos_caja:            d.tipo,
    montomovimientos_caja:           d.monto,
    medio_pagomovimientos_caja:      d.medioPago,
    referencia_idmovimientos_caja:   d.referenciaId,
    referencia_tipomovimientos_caja: d.referenciaTipo,
    descripcionmovimientos_caja:     d.descripcion,
    franquicias_idfranquicias:       d.franquiciaId,
    codigo_vouchermovimientos_caja:  d.codigoVoucher,
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
        estadosesiones_caja: 'abierta',
        OR: [
          { usuarios_idusuarios_cajero_asignado: cajeroId },
          // Cajero abrió su propia sesión sin especificarse como cajeroAsignadoId
          { usuarios_idusuarios_cajero_asignado: null, usuarios_idusuarios_apertura: cajeroId },
        ],
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

  async findHistorialByCaja(cajaId: number, limit = 20): Promise<SesionCajaEntity[]> {
    const rows = await this.prisma.sesionCaja.findMany({
      where:   { cajas_idcajas: cajaId },
      select:  SELECT_SESION,
      orderBy: { idsesiones_caja: 'desc' },
      take:    limit,
    });
    return rows.map(toSesionEntity);
  }

  async findHistorialConAlertas(cajaId: number, limit = 30) {
    const rows = await this.prisma.sesionCaja.findMany({
      where:   { cajas_idcajas: cajaId },
      select:  {
        ...SELECT_SESION,
        diferencias: {
          select: {
            iddiferencias_caja: true,
            tipo_diferencia:    true,
            monto_diferencia:   true,
            estado:             true,
            created_at:         true,
          },
        },
      },
      orderBy: { idsesiones_caja: 'desc' },
      take:    limit,
    });
    return rows.map(row => ({
      ...toSesionEntity(row),
      diferencias: row.diferencias.map(d => ({
        id:        d.iddiferencias_caja,
        tipo:      d.tipo_diferencia as 'faltante' | 'sobrante',
        monto:     d.monto_diferencia.toString(),
        estado:    d.estado as string,
        createdAt: d.created_at.toISOString(),
      })),
    }));
  }

  async calcularSaldo(sesionId: number): Promise<string> {
    const sesion = await this.prisma.sesionCaja.findUniqueOrThrow({
      where: { idsesiones_caja: sesionId },
      select: {
        monto_aperturasesiones_caja: true,
        movimientosCaja: {
          select: {
            tipomovimientos_caja:       true,
            montomovimientos_caja:      true,
            medio_pagomovimientos_caja: true,
          },
        },
      },
    });

    let saldo = Number(sesion.monto_aperturasesiones_caja);
    for (const m of sesion.movimientosCaja) {
      saldo += deltaEfectivo(
        m.tipomovimientos_caja,
        Number(m.montomovimientos_caja),
        m.medio_pagomovimientos_caja,
      );
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
        movimientosCaja: {
          select: {
            tipomovimientos_caja:       true,
            montomovimientos_caja:      true,
            medio_pagomovimientos_caja: true,
          },
        },
      },
    });

    let general = 0;
    let pagos = 0;
    for (const s of sesiones) {
      let saldo = Number(s.monto_aperturasesiones_caja);
      for (const m of s.movimientosCaja) {
        saldo += deltaEfectivo(
          m.tipomovimientos_caja,
          Number(m.montomovimientos_caja),
          m.medio_pagomovimientos_caja,
        );
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
      data:   toMovData(data),
      select: SELECT_MOV,
    });
    return toMovEntity(row);
  }

  // RNF-5.02: los movimientos relacionados se persisten en una única transacción ACID.
  // Si cualquiera falla, ninguno se escribe — conservación de masa garantizada.
  async registrarMovimientosAtomicos(
    movimientos: RegistrarMovimientoData[],
  ): Promise<MovimientoCajaEntity[]> {
    const rows = await this.prisma.$transaction(
      movimientos.map(d => this.prisma.movimientoCaja.create({
        data:   toMovData(d),
        select: SELECT_MOV,
      })),
    );
    return rows.map(toMovEntity);
  }

  async registrarTransferenciaAtomica(
    salida: RegistrarMovimientoData,
    entrada: RegistrarMovimientoData,
  ): Promise<[MovimientoCajaEntity, MovimientoCajaEntity]> {
    const [mov1, mov2] = await this.registrarMovimientosAtomicos([salida, entrada]);
    return [mov1, mov2];
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
    const [, reposicion] = await this.prisma.$transaction([
      this.prisma.movimientoCaja.create({ data: toMovData(movimientoEntrada), select: { idmovimientos_caja: true } }),
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

  async findConsignacionesBySesion(sesionId: number): Promise<ConsignacionEntity[]> {
    const rows = await this.prisma.consignacion.findMany({
      where:   { sesiones_caja_idsesiones_caja: sesionId },
      select:  SELECT_CONSIG,
      orderBy: { created_atconsignaciones: 'desc' },
    });
    return rows.map(toConsigEntity);
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

  async findDiferenciasPendientesBySucursal(sucursalId: number): Promise<(DiferenciaCajaEntity & { cajaNombre: string })[]> {
    const rows = await this.prisma.diferenciaCaja.findMany({
      where: {
        estado: 'pendiente',
        sesionCaja: { caja: { sucursales_idsucursales: sucursalId } },
      },
      select: {
        iddiferencias_caja:            true,
        sesiones_caja_idsesiones_caja: true,
        tipo_diferencia:               true,
        monto_diferencia:              true,
        custodio_id:                   true,
        estado:                        true,
        aprobador_id:                  true,
        observaciones:                 true,
        created_at:                    true,
        sesionCaja: { select: { caja: { select: { nombrecajas: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });
    return rows.map(row => ({
      ...this.toDiferenciaEntity(row),
      cajaNombre: row.sesionCaja.caja.nombrecajas,
    }));
  }

  async findDiferenciasBySucursal(sucursalId: number, filters: DiferenciasFiltros): Promise<DiferenciaRegistroItem[]> {
    const { tipo, estado, desde, hasta, limite = 200, pagina = 1 } = filters;

    const rows = await this.prisma.diferenciaCaja.findMany({
      where: {
        sesionCaja: { caja: { sucursales_idsucursales: sucursalId } },
        ...(tipo   ? { tipo_diferencia: tipo === 'faltante' ? 'faltante' : 'sobrante' } : {}),
        ...(estado ? { estado } : {}),
        ...(desde || hasta ? {
          created_at: {
            ...(desde ? { gte: desde } : {}),
            ...(hasta ? { lte: hasta } : {}),
          },
        } : {}),
      },
      select: {
        iddiferencias_caja:            true,
        sesiones_caja_idsesiones_caja: true,
        tipo_diferencia:               true,
        monto_diferencia:              true,
        estado:                        true,
        observaciones:                 true,
        created_at:                    true,
        sesionCaja: { select: { caja: { select: { nombrecajas: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take:    limite,
      skip:    (pagina - 1) * limite,
    });

    return rows.map(row => ({
      id:             row.iddiferencias_caja,
      sesionCajaId:   row.sesiones_caja_idsesiones_caja,
      cajaNombre:     row.sesionCaja.caja.nombrecajas,
      tipoDiferencia: row.tipo_diferencia as 'faltante' | 'sobrante',
      monto:          row.monto_diferencia.toString(),
      estado:         row.estado as 'pendiente' | 'aprobada' | 'rechazada',
      observaciones:  row.observaciones,
      createdAt:      row.created_at,
    }));
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
            idcajas:                          true,
            codigocajas:                      true,
            nombrecajas:                      true,
            tipocajas:                        true,
            base_diacajas:                    true,
            limite_alertacajas:               true,
            t_targetcajas:                    true,
            usuarios_idusuarios_cajero_fijo:  true,
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
        panel: { baseGeneral: '0', cajaGeneral: '0', cajaFuerteGeneral: '0', basePagos: '0', cajaPagos: '0', cajaFuertePagos: '0', acumuladoMonedaCirculante: '0', tTransito: '0', baseDisponible: '0', debeReset: false, horaReset: null },
        cajas: [],
      };
    }

    let cajonGeneralTotal    = 0;  // total operativo del punto (general + pos + menor)
    let fuerteGeneralTotal   = 0;  // bóveda física: saldo sesión general + traslados mid-turn de aux
    let cajaFuertePagosTotal = 0;  // C6: traslados mid-turn a bóveda desde cajas de pagos
    let cajonPagosTotal      = 0;
    let basePagos            = '0';
    let acumuladoMoneda      = 0;
    // BR-CAJ-011: base disponible para nuevas aperturas
    let cajaFuerteAbiertaSaldo: number | null = null;  // null = Caja Fuerte no está abierta
    let sumOpenAuxMontoApertura = 0;                   // suma de montoApertura de aux standalone

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
          cajeroFijoId: caja.usuarios_idusuarios_cajero_fijo,
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
        // ingresos/egresos describen el cajón, igual que saldoActual: un pago con
        // tarjeta o preporteado no mueve efectivo. La facturación por medio de pago
        // va aparte en saldoPorMedioPago.
        const delta = deltaEfectivo(m.tipomovimientos_caja, monto, m.medio_pagomovimientos_caja);
        saldo += delta;
        if (delta > 0)      ingresos += delta;
        else if (delta < 0) egresos  += -delta;
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
        cajaFuerteAbiertaSaldo = saldo;  // BR-CAJ-011: saldo real de la Caja Fuerte
      } else {
        // pos, menor → efectivo fuera de la bóveda. La menor es un bolsillo del punto
        // (sin cajero propio), pero su saldo tampoco está dentro de la Caja Fuerte.
        cajonGeneralTotal  += saldo;
        // C5: traslados mid-turn de aux → ya están en la bóveda física aunque la aux sigue abierta
        fuerteGeneralTotal += trasladoVault;
        // BR-CAJ-011: montoApertura > 0 solo en aperturas standalone (sin Caja Fuerte activa)
        sumOpenAuxMontoApertura += Number(sesionActiva.monto_aperturasesiones_caja);
      }

      return {
        cajaId:        caja.idcajas,
        sesionId:      sesionActiva.idsesiones_caja,
        codigo:        caja.codigocajas,
        nombre:        caja.nombrecajas,
        tipo:          caja.tipocajas as import('../domain/caja.entity.js').TipoCaja,
        cajeroId:      sesionActiva.usuarios_idusuarios_cajero_asignado
                        ?? caja.usuarios_idusuarios_cajero_fijo
                        ?? sesionActiva.usuarios_idusuarios_apertura,
        cajeroFijoId:  caja.usuarios_idusuarios_cajero_fijo,
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
        const baseDisponible = calcularBaseDisponible(
          Number(cajaPadre.base_generalcajas_padres),
          cajaFuerteAbiertaSaldo,
          sumOpenAuxMontoApertura,
        );
        return componerPanelStatus(
          cajaPadre.base_generalcajas_padres.toString(),
          cajonGeneralTotal.toFixed(2),
          fuerteGeneralTotal.toFixed(2),
          basePagos,
          cajonPagosTotal.toFixed(2),
          cajaFuertePagosTotal.toFixed(2),
          acumuladoMoneda.toFixed(2),
          tTransito,
          baseDisponible.toFixed(2),
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

  async getConsolidadoPorSesion(): Promise<{
    sesionId: number;
    cajaId: number;
    cajaNombre: string;
    sucursalNombre: string;
    cajeroNombre: string | null;
    porMedio: Record<string, string>;
  }[]> {
    const padres = await this.prisma.cajaPadre.findMany({
      where: { deleted_atcajas_padres: null },
      select: {
        cajas: {
          where: { deleted_atcajas: null },
          select: {
            idcajas:    true,
            nombrecajas: true,
            sucursal:   { select: { nombresucursales: true } },
            sesiones: {
              where: { estadosesiones_caja: 'abierta' },
              select: {
                idsesiones_caja: true,
                cajeroAsignado:  { select: { nombreusuarios: true } },
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

    const result: {
      sesionId: number;
      cajaId: number;
      cajaNombre: string;
      sucursalNombre: string;
      cajeroNombre: string | null;
      porMedio: Record<string, string>;
    }[] = [];

    for (const padre of padres) {
      for (const caja of padre.cajas) {
        for (const sesion of caja.sesiones) {
          const totales: Record<string, number> = {};
          for (const m of sesion.movimientosCaja) {
            const medio = (m.medio_pagomovimientos_caja as string | null) ?? 'efectivo';
            totales[medio] = (totales[medio] ?? 0) + Number(m.montomovimientos_caja);
          }
          result.push({
            sesionId:       sesion.idsesiones_caja,
            cajaId:         caja.idcajas,
            cajaNombre:     caja.nombrecajas,
            sucursalNombre: caja.sucursal.nombresucursales,
            cajeroNombre:   sesion.cajeroAsignado?.nombreusuarios ?? null,
            porMedio:       Object.fromEntries(
              Object.entries(totales).map(([k, v]) => [k, v.toFixed(2)]),
            ),
          });
        }
      }
    }

    return result;
  }

  async getBalancePagos(fechaInicio: Date, fechaFin: Date): Promise<BalancePagosRow[]> {
    const SELECT_SUC = {
      idsucursales:    true,
      nombresucursales: true,
      regional: { select: { nombreregionales: true } },
    } as const;

    const [consigs, movCheque, colpensiones] = await Promise.all([
      this.prisma.consignacion.findMany({
        where: {
          estadoconsignaciones:    'aprobada',
          created_atconsignaciones: { gte: fechaInicio, lt: fechaFin },
        },
        select: {
          medioconsignaciones:      true,
          montoconsignaciones:      true,
          created_atconsignaciones: true,
          sesionCaja: { select: { caja: { select: { sucursal: { select: SELECT_SUC } } } } },
        },
      }),
      this.prisma.movimientoCaja.findMany({
        where: {
          medio_pagomovimientos_caja: 'cheque',
          created_atmovimientos_caja: { gte: fechaInicio, lt: fechaFin },
        },
        select: {
          montomovimientos_caja:      true,
          created_atmovimientos_caja: true,
          sesionCaja: { select: { caja: { select: { sucursal: { select: SELECT_SUC } } } } },
        },
      }),
      this.prisma.recaudo.findMany({
        where: {
          created_atrecaudos: { gte: fechaInicio, lt: fechaFin },
          convenioRecaudo: { nombreconvenios_recaudo: { contains: 'colpensiones', mode: 'insensitive' } },
        },
        select: {
          created_atrecaudos: true,
          sucursal: { select: SELECT_SUC },
        },
      }),
    ]);

    const toDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const map = new Map<string, BalancePagosRow>();
    const getOrCreate = (sucId: number, punto: string, regional: string, fecha: string) => {
      const key = `${sucId}_${fecha}`;
      if (!map.has(key)) {
        map.set(key, { regional, punto, fecha, reposicionBanco: '0', reposicionTransportadora: '0', reposicionCheque: '0', cantidadColpensiones: 0 });
      }
      return map.get(key)!;
    };

    for (const c of consigs) {
      const suc = c.sesionCaja.caja.sucursal;
      const row = getOrCreate(suc.idsucursales, suc.nombresucursales, suc.regional.nombreregionales, toDate(c.created_atconsignaciones));
      const monto = Number(c.montoconsignaciones);
      if (c.medioconsignaciones === 'banco') {
        row.reposicionBanco = (Number(row.reposicionBanco) + monto).toFixed(2);
      } else {
        row.reposicionTransportadora = (Number(row.reposicionTransportadora) + monto).toFixed(2);
      }
    }

    for (const m of movCheque) {
      const suc = m.sesionCaja.caja.sucursal;
      const row = getOrCreate(suc.idsucursales, suc.nombresucursales, suc.regional.nombreregionales, toDate(m.created_atmovimientos_caja));
      row.reposicionCheque = (Number(row.reposicionCheque) + Number(m.montomovimientos_caja)).toFixed(2);
    }

    for (const r of colpensiones) {
      const suc = r.sucursal;
      const row = getOrCreate(suc.idsucursales, suc.nombresucursales, suc.regional.nombreregionales, toDate(r.created_atrecaudos));
      row.cantidadColpensiones += 1;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      if (a.regional !== b.regional) return a.regional.localeCompare(b.regional);
      return a.punto.localeCompare(b.punto);
    });
  }
}
