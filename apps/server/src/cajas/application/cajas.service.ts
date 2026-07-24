import { Injectable, Inject } from '@nestjs/common';
import { CAJAS_REPOSITORY } from '../domain/caja.repository.js';
import type { ICajasRepository } from '../domain/caja.repository.js';
import { SESIONES_CAJA_REPOSITORY } from '../domain/sesion-caja.repository.js';
import type { ISesionesCajaRepository } from '../domain/sesion-caja.repository.js';
import {
  CajaNoEncontradaError,
  CajaPadreNoEncontradaError,
  SesionNoEncontradaError,
  ConsignacionNoEncontradaError,
  AuxiliaresAbiertasError,
} from '../domain/caja.errors.js';
import type { CreateCajaDto } from '../dto/create-caja.dto.js';
import type { UpdateCajaDto } from '../dto/update-caja.dto.js';
import type { CreateCajaPadreDto } from '../dto/create-caja-padre.dto.js';
import type { UpdateCajaPadreDto } from '../dto/update-caja-padre.dto.js';
import {
  validarUnicidadSesion,
  validarSesionAbierta,
  validarSaldoSuficiente,
  validarConsignacionPendiente,
  evaluarAlertas,
} from '../domain/business-rules.js';
import type { AperturaAuxiliarDto } from '../dto/apertura-auxiliar.dto.js';
import type { AperturaPrincipalDto } from '../dto/apertura-principal.dto.js';
import type { CierreCajaDto } from '../dto/cierre-caja.dto.js';
import type { ConsignacionDto, AprobarConsignacionDto } from '../dto/consignacion.dto.js';
import type { DiferenciaCajaDto } from '../dto/diferencia-caja.dto.js';
import type { CambioCustodiaDto } from '../dto/cambio-custodia.dto.js';
import type { PagoAdministrativoDto } from '../dto/pago-administrativo.dto.js';
import type { AperturaDirectaDto } from '../dto/apertura-directa.dto.js';
import type { TipoMovimientoCaja, MedioPago } from '../domain/caja.entity.js';

@Injectable()
export class CajasService {
  constructor(
    @Inject(CAJAS_REPOSITORY)
    private readonly cajasRepo: ICajasRepository,
    @Inject(SESIONES_CAJA_REPOSITORY)
    private readonly sesionesRepo: ISesionesCajaRepository,
  ) {}

  // ── Caja CRUD (superadmin) ──────────────────────────────────────────────────

  async listCajas(sucursalId: number) {
    return this.cajasRepo.findBySucursal(sucursalId);
  }

  async getCaja(id: number) {
    const caja = await this.cajasRepo.findById(id);
    if (!caja) throw new CajaNoEncontradaError(id);
    return caja;
  }

  async createCaja(dto: CreateCajaDto) {
    return this.cajasRepo.createCaja({
      sucursalId:   dto.sucursalId,
      cajaPadreId:  dto.cajaPadreId,
      codigo:       dto.codigo,
      nombre:       dto.nombre,
      tipo:         dto.tipo,
      baseDia:      dto.baseDia,
      limiteAlerta: dto.limiteAlerta,
    });
  }

  async updateCaja(id: number, dto: UpdateCajaDto) {
    const caja = await this.cajasRepo.findById(id);
    if (!caja) throw new CajaNoEncontradaError(id);
    return this.cajasRepo.updateCaja(id, dto);
  }

  async deleteCaja(id: number) {
    const caja = await this.cajasRepo.findById(id);
    if (!caja) throw new CajaNoEncontradaError(id);
    await this.cajasRepo.deleteCaja(id);
  }

  // ── CajaPadre CRUD (superadmin) ─────────────────────────────────────────────

  async listCajaPadres() {
    return this.cajasRepo.findAllPadres();
  }

  async getCajaPadre(id: number) {
    const padre = await this.cajasRepo.findPadreById(id);
    if (!padre) throw new CajaPadreNoEncontradaError(id);
    return padre;
  }

  async createCajaPadre(dto: CreateCajaPadreDto) {
    return this.cajasRepo.createPadre({
      sucursalId:  dto.sucursalId,
      nombre:      dto.nombre,
      baseGeneral: dto.baseGeneral,
      horaReset:   dto.horaReset,
    });
  }

  async updateCajaPadre(id: number, dto: UpdateCajaPadreDto) {
    const padre = await this.cajasRepo.findPadreById(id);
    if (!padre) throw new CajaPadreNoEncontradaError(id);
    return this.cajasRepo.updatePadre(id, dto);
  }

  async deleteCajaPadre(id: number) {
    const padre = await this.cajasRepo.findPadreById(id);
    if (!padre) throw new CajaPadreNoEncontradaError(id);
    await this.cajasRepo.deletePadre(id);
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  async getStatusPunto(cajaPadreId: number) {
    return this.sesionesRepo.getStatusPunto(cajaPadreId);
  }

  async getStatusPuntoBySucursal(sucursalId: number) {
    const padre = await this.cajasRepo.findPadreBySucursal(sucursalId);
    if (!padre) {
      return {
        sucursalId,
        cajaPadreId: 0,
        panel: { baseGeneral: '0', cajaGeneral: '0', cajaFuerteGeneral: '0', basePagos: '0', cajaPagos: '0', cajaFuertePagos: '0', acumuladoMonedaCirculante: '0' },
        cajas: [],
      };
    }
    return this.sesionesRepo.getStatusPunto(padre.id);
  }

  async getSaldoSesion(sesionId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const caja = await this.cajasRepo.findById(sesion.cajaId);
    if (!caja) throw new CajaNoEncontradaError(sesion.cajaId);

    const saldo = await this.sesionesRepo.calcularSaldo(sesionId);
    const alertas = evaluarAlertas(saldo, caja.baseDia, caja.limiteAlerta);

    return { ...sesion, saldoActual: saldo, alertas };
  }

  async getMovimientos(sesionId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    return this.sesionesRepo.getMovimientos(sesionId);
  }

  // ── Apertura del turno principal (Caja Fuerte) ─────────────────────────────

  async abrirTurnoPrincipal(cajaPadreId: number, dto: AperturaPrincipalDto, usuarioId: number) {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);

    const cajaFuerte = await this.cajasRepo.findCajaGeneralByPadre(cajaPadreId);
    if (!cajaFuerte) throw new CajaNoEncontradaError(cajaPadreId);

    const sesionExistente = await this.sesionesRepo.findAbiertaByCaja(cajaFuerte.id);
    validarUnicidadSesion(cajaFuerte.id, !!sesionExistente);

    const sesion = await this.sesionesRepo.crearSesion({
      cajaId:            cajaFuerte.id,
      usuarioAperturaId: usuarioId,
      equipoMac:         dto.equipoMac,
      montoApertura:     dto.montoApertura,
    });

    await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesion.id,
      tipo:         'apertura',
      monto:        dto.montoApertura,
      descripcion:  'Apertura turno principal',
    });

    return sesion;
  }

  // ── Apertura directa de caja (sin sesión principal) ────────────────────────

  async abrirCajaDirecta(cajaId: number, dto: AperturaDirectaDto, usuarioId: number) {
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);

    const sesionExistente = await this.sesionesRepo.findAbiertaByCaja(cajaId);
    validarUnicidadSesion(cajaId, !!sesionExistente);

    const sesion = await this.sesionesRepo.crearSesion({
      cajaId,
      usuarioAperturaId: usuarioId,
      cajeroAsignadoId:  dto.cajeroAsignadoId,
      equipoMac:         dto.equipoMac,
      montoApertura:     dto.baseAsignada,
    });

    await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesion.id,
      tipo:         'apertura',
      monto:        dto.baseAsignada,
      descripcion:  `Apertura ${caja.nombre}`,
    });

    return sesion;
  }

  // ── Apertura de auxiliar ────────────────────────────────────────────────────

  async abrirAuxiliar(sesionPrincipalId: number, dto: AperturaAuxiliarDto, usuarioId: number) {
    const sesionPrincipal = await this.sesionesRepo.findById(sesionPrincipalId);
    if (!sesionPrincipal) throw new SesionNoEncontradaError(sesionPrincipalId);
    validarSesionAbierta(sesionPrincipalId, sesionPrincipal.estado);

    const caja = await this.cajasRepo.findById(dto.cajaAuxiliarId);
    if (!caja) throw new CajaNoEncontradaError(dto.cajaAuxiliarId);

    const sesionExistente = await this.sesionesRepo.findAbiertaByCaja(dto.cajaAuxiliarId);
    validarUnicidadSesion(dto.cajaAuxiliarId, !!sesionExistente);

    const saldoPrincipal = await this.sesionesRepo.calcularSaldo(sesionPrincipalId);
    validarSaldoSuficiente(saldoPrincipal, dto.baseAsignada);

    const nuevaSesion = await this.sesionesRepo.crearSesion({
      cajaId:            dto.cajaAuxiliarId,
      usuarioAperturaId: usuarioId,
      cajeroAsignadoId:  dto.cajeroAsignadoId,
      equipoMac:         dto.equipoMac,
      montoApertura:     dto.baseAsignada,
    });

    await Promise.all([
      this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionPrincipalId,
        tipo:         'cambio_custodia_out',
        monto:        dto.baseAsignada,
        descripcion:  `Apertura caja auxiliar ${caja.codigo}`,
      }),
      this.sesionesRepo.registrarMovimiento({
        sesionCajaId: nuevaSesion.id,
        tipo:         'cambio_custodia_in',
        monto:        dto.baseAsignada,
        descripcion:  `Base asignada desde principal`,
      }),
    ]);

    await this.sesionesRepo.crearReposicion({
      sesionOrigenId:  sesionPrincipalId,
      sesionDestinoId: nuevaSesion.id,
      monto:           dto.baseAsignada,
      usuarioId,
      estado:          'aprobada',
      motivo:          'apertura_auxiliar',
    });

    return nuevaSesion;
  }

  // ── Cierre de auxiliar ──────────────────────────────────────────────────────

  async cerrarAuxiliar(
    sesionAuxiliarId: number,
    dto: CierreCajaDto,
    usuarioId: number,
  ) {
    const sesion = await this.sesionesRepo.findById(sesionAuxiliarId);
    if (!sesion) throw new SesionNoEncontradaError(sesionAuxiliarId);
    validarSesionAbierta(sesionAuxiliarId, sesion.estado);

    const saldoEsperado = await this.sesionesRepo.calcularSaldo(sesionAuxiliarId);
    const totalArqueo = dto.totalArqueo;
    const diferencia = Number(totalArqueo) - Number(saldoEsperado);

    // Auto-find the Caja Fuerte (general) session for this punto
    let sesionGeneral: Awaited<ReturnType<typeof this.sesionesRepo.findById>> = null;
    const caja = await this.cajasRepo.findById(sesion.cajaId);
    if (caja?.cajaPadreId) {
      const cajaGeneral = await this.cajasRepo.findCajaGeneralByPadre(caja.cajaPadreId);
      if (cajaGeneral) {
        sesionGeneral = await this.sesionesRepo.findAbiertaByCaja(cajaGeneral.id);
      }
    }

    if (sesionGeneral) {
      await Promise.all([
        this.sesionesRepo.registrarMovimiento({
          sesionCajaId: sesionAuxiliarId,
          tipo:         'cambio_custodia_out',
          monto:        totalArqueo,
          descripcion:  'Cierre auxiliar — entrega a principal',
        }),
        this.sesionesRepo.registrarMovimiento({
          sesionCajaId: sesionGeneral.id,
          tipo:         'cambio_custodia_in',
          monto:        totalArqueo,
          descripcion:  `Cierre auxiliar ${sesion.cajaId} — recepción`,
        }),
      ]);
      await this.sesionesRepo.crearReposicion({
        sesionOrigenId:  sesionAuxiliarId,
        sesionDestinoId: sesionGeneral.id,
        monto:           totalArqueo,
        usuarioId,
        estado:          'aprobada',
        motivo:          'cierre_auxiliar',
      });
    }

    if (Math.abs(diferencia) >= 0.01) {
      const tipoDif = diferencia > 0 ? 'diferencia_sobrante' : 'diferencia_faltante';
      await this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionAuxiliarId,
        tipo:         tipoDif,
        monto:        Math.abs(diferencia).toFixed(2),
        descripcion:  `Diferencia automática en cierre. Esperado: $${saldoEsperado}`,
      });
    }

    return this.sesionesRepo.cerrarSesion(sesionAuxiliarId, {
      usuarioCierreId: usuarioId,
      montoCierre:     totalArqueo,
      arqueo:          dto.denominaciones,
      observaciones:   dto.observaciones,
    });
  }

  // ── Cambio de custodia ──────────────────────────────────────────────────────

  async cambioCustodia(sesionOrigenId: number, dto: CambioCustodiaDto, usuarioId: number) {
    const sesionOrigen = await this.sesionesRepo.findById(sesionOrigenId);
    if (!sesionOrigen) throw new SesionNoEncontradaError(sesionOrigenId);
    validarSesionAbierta(sesionOrigenId, sesionOrigen.estado);

    const sesionDestino = await this.sesionesRepo.findById(dto.sesionDestinoId);
    if (!sesionDestino) throw new SesionNoEncontradaError(dto.sesionDestinoId);
    validarSesionAbierta(dto.sesionDestinoId, sesionDestino.estado);

    const saldoOrigen = await this.sesionesRepo.calcularSaldo(sesionOrigenId);
    validarSaldoSuficiente(saldoOrigen, dto.monto);

    await Promise.all([
      this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionOrigenId,
        tipo:         'cambio_custodia_out',
        monto:        dto.monto,
        descripcion:  dto.motivo,
      }),
      this.sesionesRepo.registrarMovimiento({
        sesionCajaId: dto.sesionDestinoId,
        tipo:         'cambio_custodia_in',
        monto:        dto.monto,
        descripcion:  dto.motivo,
      }),
    ]);

    await this.sesionesRepo.crearReposicion({
      sesionOrigenId,
      sesionDestinoId: dto.sesionDestinoId,
      monto:           dto.monto,
      usuarioId,
      estado:          'aprobada',
      motivo:          dto.motivo ?? 'cambio_custodia',
    });

    const caja = await this.cajasRepo.findById(sesionDestino.cajaId);
    const nuevoSaldo = await this.sesionesRepo.calcularSaldo(dto.sesionDestinoId);
    const alertas = evaluarAlertas(nuevoSaldo, caja?.baseDia ?? '0', caja?.limiteAlerta ?? null);

    return { monto: dto.monto, saldoDestino: nuevoSaldo, alertas };
  }

  // ── Consignación ─────────────────────────────────────────────────────────────

  async registrarConsignacion(sesionId: number, dto: ConsignacionDto, usuarioId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    return this.sesionesRepo.crearConsignacion({
      sesionCajaId: sesionId,
      usuarioId,
      medio:        dto.medio,
      bancoNombre:  dto.bancoNombre,
      tipoCuenta:   dto.tipoCuenta,
      numeroCuenta: dto.numeroCuenta,
      monto:        dto.monto,
      proposito:    dto.proposito,
      soporteUrl:   dto.soporteUrl,
    });
  }

  async aprobarConsignacion(id: number, dto: AprobarConsignacionDto, aprobadorId: number) {
    const consignacion = await this.sesionesRepo.findConsignacionById(id);
    if (!consignacion) throw new ConsignacionNoEncontradaError(id);
    validarConsignacionPendiente(id, consignacion.estado);

    const updated = await this.sesionesRepo.aprobarConsignacion(id, {
      aprobadorId,
      estado: dto.estado,
    });

    if (dto.estado === 'aprobada') {
      await this.sesionesRepo.registrarMovimiento({
        sesionCajaId: consignacion.sesionCajaId,
        tipo:         'consignacion',
        monto:        consignacion.monto,
        descripcion:  `Consignación aprobada #${id}`,
      });
    }

    return updated;
  }

  // ── Diferencia ──────────────────────────────────────────────────────────────

  async registrarDiferencia(sesionId: number, dto: DiferenciaCajaDto) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    return this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionId,
      tipo:         dto.tipo,
      monto:        dto.valor,
      descripcion:  `${dto.causa}${dto.observacion ? ` — ${dto.observacion}` : ''}`,
    });
  }

  // ── Pago administrativo ──────────────────────────────────────────────────────

  async registrarPagoAdministrativo(sesionId: number, dto: PagoAdministrativoDto) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    return this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionId,
      tipo:         'pago_administrativo',
      monto:        dto.valor,
      descripcion:  `${dto.tipoPago}${dto.numeroCaso ? ` caso #${dto.numeroCaso}` : ''}${dto.observacion ? ` — ${dto.observacion}` : ''}`,
    });
  }

  // ── Cierre de turno principal ────────────────────────────────────────────────

  async cerrarTurnoPrincipal(sesionPrincipalId: number, dto: CierreCajaDto, usuarioId: number) {
    const sesion = await this.sesionesRepo.findById(sesionPrincipalId);
    if (!sesion) throw new SesionNoEncontradaError(sesionPrincipalId);
    validarSesionAbierta(sesionPrincipalId, sesion.estado);

    const caja = await this.cajasRepo.findById(sesion.cajaId);
    if (!caja) throw new CajaNoEncontradaError(sesion.cajaId);

    const sesionesAbiertas = await this.sesionesRepo.findAbiertasByPunto(caja.sucursalId);
    const auxiliaresAbiertas = sesionesAbiertas.filter(s => s.id !== sesionPrincipalId);
    if (auxiliaresAbiertas.length > 0) {
      throw new AuxiliaresAbiertasError(auxiliaresAbiertas.length);
    }

    const saldoEsperado = await this.sesionesRepo.calcularSaldo(sesionPrincipalId);
    const totalArqueo   = dto.totalArqueo;
    const diferencia    = Number(totalArqueo) - Number(saldoEsperado);

    await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionPrincipalId,
      tipo:         'cierre',
      monto:        totalArqueo,
      descripcion:  'Cierre de turno principal',
    });

    if (Math.abs(diferencia) >= 0.01) {
      const tipoDif = diferencia > 0 ? 'diferencia_sobrante' : 'diferencia_faltante';
      await this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionPrincipalId,
        tipo:         tipoDif,
        monto:        Math.abs(diferencia).toFixed(2),
        descripcion:  `Diferencia automática en cierre principal. Esperado: $${saldoEsperado}`,
      });
    }

    return this.sesionesRepo.cerrarSesion(sesionPrincipalId, {
      usuarioCierreId: usuarioId,
      montoCierre:     totalArqueo,
      arqueo:          dto.denominaciones,
      observaciones:   dto.observaciones,
    });
  }

  // ── Sesión activa por cajaId (para integración con ventas) ──────────────────

  async getSesionActivaByCaja(cajaId: number) {
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);
    const sesion = await this.sesionesRepo.findAbiertaByCaja(cajaId);
    if (!sesion) return null;
    const saldo  = await this.sesionesRepo.calcularSaldo(sesion.id);
    const alertas = evaluarAlertas(saldo, caja.baseDia, caja.limiteAlerta);
    return { ...sesion, saldoActual: saldo, alertas, sucursalId: caja.sucursalId };
  }

  // ── Registrar movimiento de venta (usado por VentasModule) ──────────────────

  async registrarMovimientoVenta(params: {
    sesionCajaId:   number;
    tipo:           TipoMovimientoCaja;
    monto:          string;
    medioPago?:     MedioPago;
    referenciaId?:  number;
    referenciaTipo?: string;
  }) {
    const sesion = await this.sesionesRepo.findById(params.sesionCajaId);
    if (!sesion) throw new SesionNoEncontradaError(params.sesionCajaId);
    validarSesionAbierta(params.sesionCajaId, sesion.estado);

    const movimiento = await this.sesionesRepo.registrarMovimiento({
      sesionCajaId:   params.sesionCajaId,
      tipo:           params.tipo,
      monto:          params.monto,
      medioPago:      params.medioPago,
      referenciaId:   params.referenciaId,
      referenciaTipo: params.referenciaTipo,
    });

    const caja    = await this.cajasRepo.findById(sesion.cajaId);
    const saldo   = await this.sesionesRepo.calcularSaldo(params.sesionCajaId);
    const alertas = evaluarAlertas(saldo, caja?.baseDia ?? '0', caja?.limiteAlerta ?? null);

    return { movimiento, saldoActual: saldo, alertas };
  }

  // ── Panel admin ──────────────────────────────────────────────────────────────

  async getPanelAdmin(regionalId?: number) {
    return this.cajasRepo.findPanelAdmin(regionalId);
  }

  async toggleServicioSucursal(sucursalId: number, servicioId: number, activo: boolean) {
    await this.cajasRepo.toggleServicioSucursal(sucursalId, servicioId, activo);
    return { sucursalId, servicioId, activo };
  }

  // ── Scope helpers (usado por el controller para CAJERO / SUPERVISOR_REGIONAL) ─

  async esPropietarioDeSesion(sesionId: number, userId: number): Promise<boolean> {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    return sesion.cajeroAsignadoId === userId
      || (sesion.cajeroAsignadoId === null && sesion.usuarioAperturaId === userId);
  }

  async getSucursalRegionalId(sucursalId: number): Promise<number | null> {
    return this.cajasRepo.findSucursalRegionalId(sucursalId);
  }

  async listCajasPadresByRegional(regionalId: number) {
    return this.cajasRepo.findAllPadresByRegional(regionalId);
  }

  async listCajasPadresBySucursal(sucursalId: number) {
    return this.cajasRepo.findAllPadresBySucursal(sucursalId);
  }
}
