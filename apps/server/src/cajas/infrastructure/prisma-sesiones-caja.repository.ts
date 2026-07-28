import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ISesionesCajaRepository, CrearSesionData, CerrarSesionData, RegistrarMovimientoData, CrearReposicionData, CrearConsignacionData, AprobarConsignacionData } from '../domain/sesion-caja.repository.js';
import type {
  SesionCajaEntity,
  MovimientoCajaEntity,
  ConsignacionEntity,
  ReposicionCajaEntity,
  CardAuxiliar,
  StatusPunto,
  TipoAlerta,
} from '../domain/caja.entity.js';
import { evaluarAlertas } from '../domain/business-rules.js';

const TIPOS_ENTRADA = new Set([
  'cambio_custodia_in', 'reposicion',
  'venta_producto', 'venta_servicio', 'venta_estampilla',
  'giro_emision_cobro', 'recaudo', 'diferencia_sobrante',
  'moneda_circulante', 'apartado_postal',
]);

// traslado_caja_fuerte: el cajero entrega físicamente a bóveda — reduce saldo del cajón
const TIPOS_SALIDA = new Set([
  'cambio_custodia_out', 'giro_pago', 'consignacion',
  'diferencia_faltante', 'pago_administrativo', 'anulacion',
  'traslado_caja_fuerte',
]);

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

  async findAbiertasByPunto(sucursalId: number): Promise<SesionCajaEntity[]> {
    const rows = await this.prisma.sesionCaja.findMany({
      where: {
        estadosesiones_caja: 'abierta',
        caja: { sucursales_idsucursales: sucursalId },
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
      if (TIPOS_ENTRADA.has(m.tipomovimientos_caja)) saldo += monto;
      else if (TIPOS_SALIDA.has(m.tipomovimientos_caja)) saldo -= monto;
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
        if (TIPOS_ENTRADA.has(m.tipomovimientos_caja)) saldo += monto;
        else if (TIPOS_SALIDA.has(m.tipomovimientos_caja)) saldo -= monto;
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
        estadosesiones_caja:                  'cerrada',
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

  async crearReposicion(data: CrearReposicionData): Promise<ReposicionCajaEntity> {
    const row = await this.prisma.reposicionCaja.create({
      data: {
        sesiones_caja_idsesiones_caja_origen:  data.sesionOrigenId,
        sesiones_caja_idsesiones_caja_destino: data.sesionDestinoId,
        montoreposiciones_caja:                data.monto,
        usuarios_idusuarios:                   data.usuarioId,
        estadoreposiciones_caja:               data.estado,
        motivoreposiciones_caja:               data.motivo,
      },
      select: {
        idreposiciones_caja:                          true,
        sesiones_caja_idsesiones_caja_origen:         true,
        sesiones_caja_idsesiones_caja_destino:        true,
        montoreposiciones_caja:                       true,
        usuarios_idusuarios:                          true,
        estadoreposiciones_caja:                      true,
        motivoreposiciones_caja:                      true,
        created_atreposiciones_caja:                  true,
      },
    });
    return {
      id:               row.idreposiciones_caja,
      sesionOrigenId:   row.sesiones_caja_idsesiones_caja_origen,
      sesionDestinoId:  row.sesiones_caja_idsesiones_caja_destino,
      monto:            row.montoreposiciones_caja.toString(),
      usuarioId:        row.usuarios_idusuarios,
      estado:           row.estadoreposiciones_caja as ReposicionCajaEntity['estado'],
      motivo:           row.motivoreposiciones_caja,
      createdAt:        row.created_atreposiciones_caja,
    };
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
        idcajas_padres:           true,
        sucursales_idsucursales:  true,
        base_generalcajas_padres: true,
        cajas: {
          where: { activocajas: true, deleted_atcajas: null },
          select: {
            idcajas:            true,
            codigocajas:        true,
            nombrecajas:        true,
            tipocajas:          true,
            base_diacajas:      true,
            limite_alertacajas: true,
            sesiones: {
              where: { estadosesiones_caja: 'abierta' },
              take: 1,
              select: {
                idsesiones_caja:                         true,
                usuarios_idusuarios_apertura:            true,
                usuarios_idusuarios_cajero_asignado:     true,
                monto_aperturasesiones_caja:             true,
                movimientosCaja: {
                  select: { tipomovimientos_caja: true, montomovimientos_caja: true },
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
        panel: { baseGeneral: '0', cajaGeneral: '0', cajaFuerteGeneral: '0', basePagos: '0', cajaPagos: '0', cajaFuertePagos: '0', acumuladoMonedaCirculante: '0' },
        cajas: [],
      };
    }

    let cajonGeneralTotal = 0;   // total en punto (principal + auxiliares)
    let fuerteGeneralTotal = 0;  // solo auxiliares (pos + menor)
    let cajonPagosTotal = 0;
    let basePagos = '0';
    let acumuladoMoneda = 0;

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
          cajaFuerte:   '0',
          baseDia:      caja.base_diacajas.toString(),
          limiteAlerta: caja.limite_alertacajas?.toString() ?? null,
          ingresosTurno: '0',
          egresosTurno:  '0',
          girosCount:    0,
          girosValor:    '0',
          alertas:       [],
        };
      }

      let saldo = Number(sesionActiva.monto_aperturasesiones_caja);
      let ingresos = 0;
      let egresos = 0;
      let monedaCirculante = 0;

      for (const m of sesionActiva.movimientosCaja) {
        const monto = Number(m.montomovimientos_caja);
        if (TIPOS_ENTRADA.has(m.tipomovimientos_caja)) { saldo += monto; ingresos += monto; }
        else if (TIPOS_SALIDA.has(m.tipomovimientos_caja)) { saldo -= monto; egresos += monto; }
        if (m.tipomovimientos_caja === 'moneda_circulante') monedaCirculante += monto;
      }

      acumuladoMoneda += monedaCirculante;

      const girosCount = sesionActiva.giros.length;
      const girosValor = sesionActiva.giros.reduce((acc, g) => acc + Number(g.monto_copgiros), 0);

      const baseDia = caja.base_diacajas.toString();
      const limiteAlerta = caja.limite_alertacajas?.toString() ?? null;
      const alertas: TipoAlerta[] = evaluarAlertas(saldo.toFixed(2), baseDia, limiteAlerta);

      if (caja.tipocajas === 'pagos') {
        cajonPagosTotal += saldo;
        basePagos = baseDia;
      } else if (caja.tipocajas === 'general') {
        // Sesión del cajero principal = la caja fuerte física del punto
        cajonGeneralTotal  += saldo;
        fuerteGeneralTotal += saldo;
      } else {
        // pos, menor → bolsillo de cada cajero auxiliar
        cajonGeneralTotal += saldo;
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
        ingresosTurno: ingresos.toFixed(2),
        egresosTurno:  egresos.toFixed(2),
        girosCount,
        girosValor:    girosValor.toFixed(2),
        alertas,
      };
    });

    return {
      sucursalId:  cajaPadre.sucursales_idsucursales,
      cajaPadreId: cajaPadre.idcajas_padres,
      panel: {
        baseGeneral:               cajaPadre.base_generalcajas_padres.toString(),
        cajaGeneral:               cajonGeneralTotal.toFixed(2),    // total punto (principal + fuertes)
        cajaFuerteGeneral:         fuerteGeneralTotal.toFixed(2),   // solo suma de cajas fuertes auxiliares
        basePagos,
        cajaPagos:                 cajonPagosTotal.toFixed(2),
        cajaFuertePagos:           '0',
        acumuladoMonedaCirculante: acumuladoMoneda.toFixed(2),
      },
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
}
