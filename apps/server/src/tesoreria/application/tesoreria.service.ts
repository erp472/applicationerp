import { Inject, Injectable, Optional, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SESIONES_CAJA_REPOSITORY, type ISesionesCajaRepository } from '../../cajas/domain/sesion-caja.repository.js';
import { RealtimeService } from '../../realtime/realtime.service.js';
import type { HistorialQueryDto, RegistrarMovimientoDto } from '../dto/movimiento-tesoreria.dto.js';

export type TipoMovimientoTesoreria = 'apertura' | 'ingreso' | 'egreso';

export interface CajeroActivo {
  sesionId:   number;
  cajaNombre: string;
  cajero:     string;
  saldo:      string;
}

export interface CajaPrincipalItem {
  cajaPadreId:      number;
  nombre:           string;
  sucursalId:       number;
  sucursalNombre:   string;
  regionalNombre:   string;
  comercioNombre:   string;
  supervisorId:     number | null;
  supervisorNombre: string | null;
  baseAsignada:     string;
  /** Efectivo que el punto custodia ahora mismo en sesiones abiertas */
  efectivoEnPunto:  string;
  /** Quién está operando el dinero del punto en este momento */
  cajerosActivos:   CajeroActivo[];
  /** Un punto sin asignación nunca ha recibido dinero: ni por histórico ni por base
   *  previa al módulo. Solo esos admiten apertura; el resto van por ingreso/egreso. */
  tieneApertura:    boolean;
  ultimoMovimiento: Date | null;
}

export interface MovimientoTesoreriaItem {
  id:               number;
  cajaPadreId:      number;
  puntoNombre:      string;
  sucursalNombre:   string;
  tipo:             TipoMovimientoTesoreria;
  monto:            string;
  codigoAprobacion: string;
  descripcion:      string;
  saldoResultante:  string;
  registradoPor:    string;
  createdAt:        Date;
}

const SELECT_MOV = {
  idmovimientos_tesoreria:                true,
  cajas_padres_idcajas_padres:            true,
  tipomovimientos_tesoreria:              true,
  montomovimientos_tesoreria:             true,
  codigo_aprobacionmovimientos_tesoreria: true,
  descripcionmovimientos_tesoreria:       true,
  saldo_resultantemovimientos_tesoreria:  true,
  created_atmovimientos_tesoreria:        true,
  usuario:   { select: { nombreusuarios: true } },
  cajaPadre: {
    select: {
      nombrecajas_padres: true,
      sucursal: { select: { nombresucursales: true } },
    },
  },
} as const;

@Injectable()
export class TesoreriaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SESIONES_CAJA_REPOSITORY) private readonly sesionesRepo: ISesionesCajaRepository,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /** Puntos a los que Tesorería puede girar dinero. Un punto sin supervisor todavía
   *  no es un destino válido: el dinero se asigna al custodio, no a la sucursal. */
  async listarCajasPrincipales(): Promise<CajaPrincipalItem[]> {
    const puntos = await this.prisma.cajaPadre.findMany({
      where: { deleted_atcajas_padres: null },
      select: {
        idcajas_padres:           true,
        nombrecajas_padres:       true,
        base_generalcajas_padres: true,
        supervisor: { select: { idusuarios: true, nombreusuarios: true } },
        sucursal: {
          select: {
            idsucursales:     true,
            nombresucursales: true,
            regional: {
              select: {
                nombreregionales: true,
                comercio: { select: { nombrecomercios: true } },
              },
            },
          },
        },
        movimientosTesoreria: {
          select: { created_atmovimientos_tesoreria: true },
          orderBy: { idmovimientos_tesoreria: 'desc' },
          take: 1,
        },
      },
      orderBy: { nombrecajas_padres: 'asc' },
    });

    return Promise.all(
      puntos.map(async (p) => {
        const { total, cajeros } = await this.estadoPunto(p.idcajas_padres);
        return {
          cajaPadreId:      p.idcajas_padres,
          nombre:           p.nombrecajas_padres,
          sucursalId:       p.sucursal.idsucursales,
          sucursalNombre:   p.sucursal.nombresucursales,
          regionalNombre:   p.sucursal.regional.nombreregionales,
          comercioNombre:   p.sucursal.regional.comercio.nombrecomercios,
          supervisorId:     p.supervisor?.idusuarios ?? null,
          supervisorNombre: p.supervisor?.nombreusuarios ?? null,
          baseAsignada:     p.base_generalcajas_padres.toFixed(2),
          efectivoEnPunto:  total,
          cajerosActivos:   cajeros,
          tieneApertura:    p.movimientosTesoreria.length > 0 || Number(p.base_generalcajas_padres) > 0,
          ultimoMovimiento: p.movimientosTesoreria[0]?.created_atmovimientos_tesoreria ?? null,
        };
      }),
    );
  }

  async historial(q: HistorialQueryDto): Promise<MovimientoTesoreriaItem[]> {
    const rows = await this.prisma.movimientoTesoreria.findMany({
      where: {
        ...(q.cajaPadreId ? { cajas_padres_idcajas_padres: q.cajaPadreId } : {}),
        ...(q.tipo ? { tipomovimientos_tesoreria: q.tipo } : {}),
        ...(q.desde || q.hasta
          ? {
              created_atmovimientos_tesoreria: {
                ...(q.desde ? { gte: q.desde } : {}),
                ...(q.hasta ? { lte: q.hasta } : {}),
              },
            }
          : {}),
      },
      select:  SELECT_MOV,
      orderBy: { idmovimientos_tesoreria: 'desc' },
      take:    q.limite,
      skip:    (q.pagina - 1) * q.limite,
    });

    return rows.map((r) => ({
      id:               r.idmovimientos_tesoreria,
      cajaPadreId:      r.cajas_padres_idcajas_padres,
      puntoNombre:      r.cajaPadre.nombrecajas_padres,
      sucursalNombre:   r.cajaPadre.sucursal.nombresucursales,
      tipo:             r.tipomovimientos_tesoreria,
      monto:            r.montomovimientos_tesoreria.toFixed(2),
      codigoAprobacion: r.codigo_aprobacionmovimientos_tesoreria,
      descripcion:      r.descripcionmovimientos_tesoreria,
      saldoResultante:  r.saldo_resultantemovimientos_tesoreria.toFixed(2),
      registradoPor:    r.usuario.nombreusuarios,
      createdAt:        r.created_atmovimientos_tesoreria,
    }));
  }

  async registrar(
    cajaPadreId: number,
    tipo: TipoMovimientoTesoreria,
    dto: RegistrarMovimientoDto,
    usuarioId: number,
  ): Promise<MovimientoTesoreriaItem> {
    const punto = await this.prisma.cajaPadre.findFirst({
      where:  { idcajas_padres: cajaPadreId, deleted_atcajas_padres: null },
      select: { base_generalcajas_padres: true, usuarios_idusuarios_supervisor: true },
    });
    if (!punto) throw new NotFoundException(`Caja principal ${cajaPadreId} no encontrada`);

    // El giro va del comercio al supervisor de la regional: sin custodio no hay destino.
    if (!punto.usuarios_idusuarios_supervisor) {
      throw new BadRequestException('La caja principal no tiene supervisor asignado');
    }

    const duplicado = await this.prisma.movimientoTesoreria.findUnique({
      where:  { codigo_aprobacionmovimientos_tesoreria: dto.codigoAprobacion },
      select: { idmovimientos_tesoreria: true },
    });
    if (duplicado) {
      throw new ConflictException(`El código de aprobación ${dto.codigoAprobacion} ya fue registrado`);
    }

    const base  = Number(punto.base_generalcajas_padres);
    const monto = Number(dto.monto);
    if (monto <= 0) throw new BadRequestException('El monto debe ser mayor a cero');

    // Los puntos que ya existían antes de este módulo tienen base_general asignada pero
    // ningún movimiento histórico. Cuentan como abiertos: su dinero ya fue girado.
    const movimientos = await this.prisma.movimientoTesoreria.count({
      where: { cajas_padres_idcajas_padres: cajaPadreId },
    });
    const yaTieneAsignacion = movimientos > 0 || base > 0;

    if (tipo === 'apertura' && yaTieneAsignacion) {
      throw new ConflictException(
        'La caja principal ya tiene dinero asignado; registra un ingreso o un egreso',
      );
    }
    if (tipo !== 'apertura' && !yaTieneAsignacion) {
      throw new BadRequestException('La caja principal aún no tiene apertura registrada');
    }

    // La apertura fija la asignación inicial; ingresos y egresos la mueven desde ahí.
    const saldoResultante =
      tipo === 'apertura' ? monto :
      tipo === 'ingreso'  ? base + monto :
                            base - monto;

    if (saldoResultante < 0) {
      throw new BadRequestException(
        `El egreso de ${monto.toFixed(2)} supera lo asignado al punto (${base.toFixed(2)})`,
      );
    }

    // Solo se valida cuando la operación reduce la asignación: el punto no puede quedar
    // con menos techo del efectivo que ya tiene físicamente en cajas abiertas.
    if (saldoResultante < base) {
      const comprometido = Number(await this.efectivoEnPunto(cajaPadreId));
      if (saldoResultante < comprometido) {
        throw new BadRequestException(
          `El punto custodia ${comprometido.toFixed(2)} en cajas abiertas; ` +
          `no se puede dejar la asignación en ${saldoResultante.toFixed(2)}`,
        );
      }
    }

    const [, movimiento] = await this.prisma.$transaction([
      this.prisma.cajaPadre.update({
        where: { idcajas_padres: cajaPadreId },
        data:  { base_generalcajas_padres: saldoResultante.toFixed(2) },
      }),
      this.prisma.movimientoTesoreria.create({
        data: {
          cajas_padres_idcajas_padres:            cajaPadreId,
          usuarios_idusuarios:                    usuarioId,
          tipomovimientos_tesoreria:              tipo,
          montomovimientos_tesoreria:             dto.monto,
          codigo_aprobacionmovimientos_tesoreria: dto.codigoAprobacion,
          descripcionmovimientos_tesoreria:       dto.descripcion,
          saldo_resultantemovimientos_tesoreria:  saldoResultante.toFixed(2),
        },
        select: SELECT_MOV,
      }),
    ]);

    this.realtime?.broadcast('tesoreria.movimiento', {
      cajaPadreId,
      tipo,
      saldoResultante: saldoResultante.toFixed(2),
    });

    return {
      id:               movimiento.idmovimientos_tesoreria,
      cajaPadreId:      movimiento.cajas_padres_idcajas_padres,
      puntoNombre:      movimiento.cajaPadre.nombrecajas_padres,
      sucursalNombre:   movimiento.cajaPadre.sucursal.nombresucursales,
      tipo:             movimiento.tipomovimientos_tesoreria,
      monto:            movimiento.montomovimientos_tesoreria.toFixed(2),
      codigoAprobacion: movimiento.codigo_aprobacionmovimientos_tesoreria,
      descripcion:      movimiento.descripcionmovimientos_tesoreria,
      saldoResultante:  movimiento.saldo_resultantemovimientos_tesoreria.toFixed(2),
      registradoPor:    movimiento.usuario.nombreusuarios,
      createdAt:        movimiento.created_atmovimientos_tesoreria,
    };
  }

  private async efectivoEnPunto(cajaPadreId: number): Promise<string> {
    const { total } = await this.estadoPunto(cajaPadreId);
    return total;
  }

  /** Efectivo vivo del punto y quién lo está operando. El saldo sale del mismo
   *  cálculo que usa Cajas, para que Tesorería no vea una cifra distinta. */
  private async estadoPunto(cajaPadreId: number): Promise<{ total: string; cajeros: CajeroActivo[] }> {
    const sesiones = await this.prisma.sesionCaja.findMany({
      where: {
        estadosesiones_caja: 'abierta',
        caja: { cajas_padres_idcajas_padres: cajaPadreId },
      },
      select: {
        idsesiones_caja: true,
        caja:            { select: { nombrecajas: true } },
        cajeroAsignado:  { select: { nombreusuarios: true } },
        usuarioApertura: { select: { nombreusuarios: true } },
      },
      orderBy: { idsesiones_caja: 'asc' },
    });

    const cajeros = await Promise.all(
      sesiones.map(async (s) => ({
        sesionId:   s.idsesiones_caja,
        cajaNombre: s.caja.nombrecajas,
        cajero:     s.cajeroAsignado?.nombreusuarios ?? s.usuarioApertura.nombreusuarios,
        saldo:      Number(await this.sesionesRepo.calcularSaldo(s.idsesiones_caja)).toFixed(2),
      })),
    );

    return {
      total: cajeros.reduce((acc, c) => acc + Number(c.saldo), 0).toFixed(2),
      cajeros,
    };
  }
}
