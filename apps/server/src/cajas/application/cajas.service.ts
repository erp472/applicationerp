import { Injectable, Inject } from '@nestjs/common';
import { CAJAS_REPOSITORY } from '../domain/caja.repository.js';
import type { ICajasRepository } from '../domain/caja.repository.js';
import { SESIONES_CAJA_REPOSITORY } from '../domain/sesion-caja.repository.js';
import type { ISesionesCajaRepository } from '../domain/sesion-caja.repository.js';
import {
  CajaNoEncontradaError,
  SesionNoEncontradaError,
  ConsignacionNoEncontradaError,
} from '../domain/caja.errors.js';
import {
  validarUnicidadSesion,
  validarSesionAbierta,
  validarSaldoSuficiente,
  validarConsignacionPendiente,
  evaluarAlertas,
} from '../domain/business-rules.js';
import type { AperturaAuxiliarDto } from '../dto/apertura-auxiliar.dto.js';
import type { CierreCajaDto } from '../dto/cierre-caja.dto.js';
import type { ConsignacionDto, AprobarConsignacionDto } from '../dto/consignacion.dto.js';
import type { DiferenciaCajaDto } from '../dto/diferencia-caja.dto.js';
import type { CambioCustodiaDto } from '../dto/cambio-custodia.dto.js';
import type { PagoAdministrativoDto } from '../dto/pago-administrativo.dto.js';

@Injectable()
export class CajasService {
  constructor(
    @Inject(CAJAS_REPOSITORY)
    private readonly cajasRepo: ICajasRepository,
    @Inject(SESIONES_CAJA_REPOSITORY)
    private readonly sesionesRepo: ISesionesCajaRepository,
  ) {}

  // ── Status ──────────────────────────────────────────────────────────────────

  async getStatusPunto(sucursalId: number) {
    return this.sesionesRepo.getStatusPunto(sucursalId);
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
    sesionPrincipalId: number,
    usuarioId: number,
  ) {
    const sesion = await this.sesionesRepo.findById(sesionAuxiliarId);
    if (!sesion) throw new SesionNoEncontradaError(sesionAuxiliarId);
    validarSesionAbierta(sesionAuxiliarId, sesion.estado);

    const sesionPrincipal = await this.sesionesRepo.findById(sesionPrincipalId);
    if (!sesionPrincipal) throw new SesionNoEncontradaError(sesionPrincipalId);
    validarSesionAbierta(sesionPrincipalId, sesionPrincipal.estado);

    const saldoEsperado = await this.sesionesRepo.calcularSaldo(sesionAuxiliarId);
    const totalArqueo = dto.totalArqueo;
    const diferencia = Number(totalArqueo) - Number(saldoEsperado);

    await Promise.all([
      this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionAuxiliarId,
        tipo:         'cambio_custodia_out',
        monto:        totalArqueo,
        descripcion:  'Cierre auxiliar — entrega a principal',
      }),
      this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionPrincipalId,
        tipo:         'cambio_custodia_in',
        monto:        totalArqueo,
        descripcion:  `Cierre auxiliar ${sesion.cajaId} — recepción`,
      }),
    ]);

    if (Math.abs(diferencia) >= 0.01) {
      const tipoDif = diferencia > 0 ? 'diferencia_sobrante' : 'diferencia_faltante';
      await this.sesionesRepo.registrarMovimiento({
        sesionCajaId: sesionAuxiliarId,
        tipo:         tipoDif,
        monto:        Math.abs(diferencia).toFixed(2),
        descripcion:  `Diferencia automática en cierre. Esperado: $${saldoEsperado}`,
      });
    }

    await this.sesionesRepo.crearReposicion({
      sesionOrigenId:  sesionAuxiliarId,
      sesionDestinoId: sesionPrincipalId,
      monto:           totalArqueo,
      usuarioId,
      estado:          'aprobada',
      motivo:          'cierre_auxiliar',
    });

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
}
