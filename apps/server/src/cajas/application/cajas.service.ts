import { Injectable, Inject, BadRequestException, Optional } from '@nestjs/common';
import crypto from 'crypto';
import { CAJAS_REPOSITORY } from '../domain/caja.repository.js';
import type { ICajasRepository } from '../domain/caja.repository.js';
import { SESIONES_CAJA_REPOSITORY } from '../domain/sesion-caja.repository.js';
import type { ISesionesCajaRepository } from '../domain/sesion-caja.repository.js';
import {
  CajaNoEncontradaError,
  CajaPadreNoEncontradaError,
  SesionNoEncontradaError,
  ConsignacionNoEncontradaError,
  DiferenciaNoEncontradaError,
  DiferenciaEstadoInvalidoError,
  SoDViolacionError,
  ReposicionNoEncontradaError,
  ReposicionEstadoInvalidoError,
  DiscrepanciaTransitoError,
  AuxiliaresAbiertasError,
  BasePuntoInsuficienteError,
  ConfiguracionPuntoInvalidaError,
  CajaNoAsignableError,
  CajaSinCajeroError,
  UsuarioNoAsignableError,
} from '../domain/caja.errors.js';
import type { CreateCajaDto } from '../dto/create-caja.dto.js';
import type { UpdateCajaDto } from '../dto/update-caja.dto.js';
import type { CreateCajaPadreDto } from '../dto/create-caja-padre.dto.js';
import type { UpdateCajaPadreDto } from '../dto/update-caja-padre.dto.js';
import {
  validarUnicidadSesion,
  validarUnicidadCustodio,
  validarSesionAbierta,
  validarSaldoSuficiente,
  validarConsignacionPendiente,
  validarAperturaPunto,
  validarBaseAsignadaMaxima,
  evaluarAlertas,
  TIPOS_MOVIMIENTO_ENTRADA,
  TIPOS_MOVIMIENTO_SALIDA,
  esTarjeta,
} from '../domain/business-rules.js';
import { calcularCierreSesion } from '../domain/calculos/cierre-sesion.js';
import { compararArqueoConSaldo } from '../domain/calculos/arqueo-denominaciones.js';
import { calcularMonedaCirculante } from '../domain/calculos/moneda-circulante.js';
import { consolidarComercio } from '../domain/calculos/consolidado-comercio.js';
import { calcularCapacidadPunto } from '../domain/calculos/capacidad-punto.js';
import {
  esCajaOperativa, puedeSupervisarPunto, puedeSerCajeroDeCaja,
  resolverCajeroDeApertura, requiereCajero, puedeOperarSesion,
} from '../domain/calculos/asignacion-caja.js';
import {
  diagnosticarPunto,
  regresionesConfiguracion,
  type CajaConfigurada,
  type DiagnosticoPunto,
} from '../domain/calculos/coherencia-punto.js';
import { buildBaseAperturaPrincipal, calcularBaseAsignadaAuxiliar } from '../domain/calculos/base-apertura.js';
import { buildDebitoPrincipalPorApertura, buildCreditoAuxiliarPorApertura, calcularCambioCustodiaEnSesion } from '../domain/calculos/cambio-custodia.js';
import { buildPagoAdministrativo } from '../domain/calculos/pago-administrativo-calc.js';
import {
  validarMontoConsignacion,
  buildImpactoConsignacionAprobada,
} from '../domain/calculos/consignacion.js';
import { calcularSaldoPorMedioPago } from '../domain/calculos/saldo-por-medio-pago.js';
import { evaluarCierreForzado } from '../domain/calculos/cierre-forzado.js';
import { calcularTrasladoCajaFuerte } from '../domain/calculos/traslado-caja-fuerte.js';
import {
  calcularDiferenciaFaltante,
  calcularDiferenciaSobrante,
} from '../domain/calculos/diferencia-saldo.js';
import { calcularDevolucionAPrincipal } from '../domain/calculos/devolucion-principal.js';
import { calcularCajasHabilitadas } from '../domain/calculos/cajas-habilitadas.js';
import { calcularSaldoCaja } from '../domain/calculos/saldo-caja.js';
import { repartirPagoPorMedio } from '../domain/calculos/reparto-medio-pago.js';
import { calcularSaldoCajaFuerte } from '../domain/calculos/saldo-caja-fuerte.js';
import { calcularReposicionCaja } from '../domain/calculos/reposicion-caja.js';
import type { AperturaAuxiliarDto } from '../dto/apertura-auxiliar.dto.js';
import type { AperturaPrincipalDto } from '../dto/apertura-principal.dto.js';
import type { CierreCajaDto } from '../dto/cierre-caja.dto.js';
import type { ConsignacionDto, AprobarConsignacionDto } from '../dto/consignacion.dto.js';
import type { DiferenciaCajaDto } from '../dto/diferencia-caja.dto.js';
import type { CambioCustodiaDto } from '../dto/cambio-custodia.dto.js';
import type { PagoAdministrativoDto } from '../dto/pago-administrativo.dto.js';
import type { AperturaDirectaDto } from '../dto/apertura-directa.dto.js';
import type { TipoMovimientoCaja, MedioPago, TipoCaja, PerfilUsuario } from '../domain/caja.entity.js';
import { RealtimeService } from '../../realtime/realtime.service.js';
import { PrismaService }  from '../../prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class CajasService {
  constructor(
    @Inject(CAJAS_REPOSITORY)
    private readonly cajasRepo: ICajasRepository,
    @Inject(SESIONES_CAJA_REPOSITORY)
    private readonly sesionesRepo: ISesionesCajaRepository,
    @Optional() private readonly realtime?: RealtimeService,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  private auditCaja(
    accion: 'CREATE' | 'UPDATE',
    tipoEvento: string,
    sesionId: number,
    usuarioId: number,
    meta: Record<string, unknown>,
  ): void {
    void this.audit?.log({
      usuario_id:    usuarioId,
      accion,
      entidad:       'sesiones_caja',
      entidad_id:    sesionId,
      resultado:     'OK',
      datos_despues: { tipo_evento: tipoEvento, sesion_id: sesionId, ...meta },
    });
  }

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
    if (dto.cajaPadreId) {
      await this.assertConfiguracionPuntoValida(dto.cajaPadreId, [{
        codigo: dto.codigo, tipo: dto.tipo, baseDia: dto.baseDia ?? '0', activo: true,
      }]);
    }
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
    if (caja.cajaPadreId) {
      await this.assertConfiguracionPuntoValida(caja.cajaPadreId, [{
        codigo:  caja.codigo,
        tipo:    caja.tipo,
        baseDia: dto.baseDia ?? caja.baseDia,
        activo:  dto.activo ?? caja.activo,
      }], caja.id);
    }
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

  async getCajaPadreBySucursal(sucursalId: number) {
    return this.cajasRepo.findPadreBySucursal(sucursalId);
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
    // Bajar la base del punto puede dejar por debajo a cajas ya configuradas
    if (dto.baseGeneral !== undefined) {
      await this.assertConfiguracionPuntoValida(id, [], undefined, dto.baseGeneral);
    }
    return this.cajasRepo.updatePadre(id, dto);
  }

  // ── Coherencia de configuración del punto ───────────────────────────────────

  async diagnosticarPunto(cajaPadreId: number): Promise<DiagnosticoPunto> {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);
    const cajas = await this.cajasRepo.findByPadre(cajaPadreId);
    return diagnosticarPunto(padre.baseGeneral, padre.supervisorId ?? null, cajas);
  }

  // Rechaza guardar una configuración que el motor de apertura va a rechazar después
  // (BR-CAJ-010 y BR-CAJ-011). `pendientes` son las cajas tal como quedarían tras el
  // guardado; `excluirId` saca de la foto la versión anterior de la caja editada.
  private async assertConfiguracionPuntoValida(
    cajaPadreId: number,
    pendientes: CajaConfigurada[],
    excluirId?: number,
    baseGeneralNueva?: string,
  ): Promise<void> {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);

    const todas      = await this.cajasRepo.findByPadre(cajaPadreId);
    const existentes = todas.filter(c => c.id !== excluirId);

    const antes = diagnosticarPunto(padre.baseGeneral, padre.supervisorId ?? null, todas);
    const despues = diagnosticarPunto(
      baseGeneralNueva ?? padre.baseGeneral,
      padre.supervisorId ?? null,
      [...existentes, ...pendientes],
    );
    const regresiones = regresionesConfiguracion(antes, despues);

    if (regresiones.includes('base_fuerte_excede_punto')) {
      throw new ConfiguracionPuntoInvalidaError(
        `El fondo de la Caja Fuerte ($${despues.baseFuerte}) supera la base asignada al punto ` +
        `${padre.nombre} ($${despues.baseGeneral}). El excedente pertenece a la Caja General.`,
      );
    }
    if (regresiones.includes('reparto_excede_fuerte')) {
      throw new ConfiguracionPuntoInvalidaError(
        `Las cajas del punto ${padre.nombre} tienen asignados $${despues.sumaRepartida} y la ` +
        `Caja Fuerte solo custodia $${despues.baseFuerte}. Reduzca alguna base o suba el fondo ` +
        `de la Caja Fuerte antes de guardar.`,
      );
    }
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
        panel: { baseGeneral: '0', cajaGeneral: '0', cajaFuerteGeneral: '0', basePagos: '0', cajaPagos: '0', cajaFuertePagos: '0', acumuladoMonedaCirculante: '0', tTransito: '0', baseDisponible: '0', debeReset: false, horaReset: null },
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

    const [saldo, movimientos] = await Promise.all([
      this.sesionesRepo.calcularSaldo(sesionId),
      this.sesionesRepo.getMovimientos(sesionId),
    ]);
    const alertas = evaluarAlertas(saldo, caja.baseDia, caja.limiteAlerta);
    const saldoPorMedio = calcularSaldoPorMedioPago(
      movimientos
        .filter(m =>
          TIPOS_MOVIMIENTO_ENTRADA.has(m.tipo) ||
          TIPOS_MOVIMIENTO_SALIDA.has(m.tipo),
        )
        .map(m => ({
          medioPago: m.medioPago ?? undefined,
          monto:     m.monto,
          esEntrada: TIPOS_MOVIMIENTO_ENTRADA.has(m.tipo),
        })),
    );

    return { ...sesion, saldoActual: saldo, alertas, saldoPorMedio };
  }

  async getMovimientos(sesionId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    return this.sesionesRepo.getMovimientos(sesionId);
  }

  // ── Apertura de sesión principal (Caja Fuerte) ──────────────────────────────

  async abrirSesionPrincipal(cajaPadreId: number, dto: AperturaPrincipalDto, usuarioId: number) {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);

    const cajaFuerte = await this.cajasRepo.findCajaGeneralByPadre(cajaPadreId);
    if (!cajaFuerte) throw new CajaNoEncontradaError(cajaPadreId);

    const sesionExistente = await this.sesionesRepo.findAbiertaByCaja(cajaFuerte.id);
    validarUnicidadSesion(cajaFuerte.id, !!sesionExistente);

    // BR-CAJ-010: el punto solo custodia lo que la Caja General le asignó
    validarAperturaPunto(dto.montoApertura, padre.baseGeneral, padre.nombre);

    const baseApertura = buildBaseAperturaPrincipal(dto.montoApertura);

    const sesion = await this.sesionesRepo.crearSesion({
      cajaId:            cajaFuerte.id,
      usuarioAperturaId: usuarioId,
      equipoMac:         dto.equipoMac,
      montoApertura:     baseApertura.montoApertura,
    });

    await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesion.id,
      tipo:         baseApertura.tipoMovimiento,
      monto:        baseApertura.saldoInicial,
      descripcion:  'Apertura caja principal',
    });

    this.realtime?.broadcast('cajas.sesion.abierta', { cajaPadreId });
    this.auditCaja('CREATE', 'apertura_principal', sesion.id, usuarioId, {
      caja_id:    sesion.cajaId,
      punto_id:   cajaPadreId,
      equipo_mac: dto.equipoMac ?? null,
    });
    return sesion;
  }

  // ── Apertura directa de caja (sin sesión principal) ────────────────────────
  // RF-3.02: si hay sesión principal abierta se usa el flujo de abrirAuxiliar
  // (débito en general + crédito en nueva sesión con montoApertura='0') para
  // evitar inflar cajaGeneral con fondos que no salieron de ella al cierre.
  // Solo cuando no existe sesión principal se abre con base externa (montoApertura=base).

  async abrirCajaDirecta(cajaId: number, dto: AperturaDirectaDto, usuarioId: number) {
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);

    const sesionExistente = await this.sesionesRepo.findAbiertaByCaja(cajaId);
    validarUnicidadSesion(cajaId, !!sesionExistente);

    if (dto.cajeroAsignadoId) this.assertCajaAsignable(caja);

    // La caja se abre a nombre de su cajero fijo si la apertura no manda otro
    const cajeroApertura = resolverCajeroDeApertura(caja.tipo, dto.cajeroAsignadoId, caja.cajeroFijoId);
    if (requiereCajero(caja.tipo, cajeroApertura)) throw new CajaSinCajeroError(caja.codigo);

    // Valida que el cajero (explícito o el propio usuario que llama) no tenga ya una sesión abierta
    const cajeroAValidar = cajeroApertura ?? usuarioId;
    const sesionCajero = await this.sesionesRepo.findAbiertaByCajero(cajeroAValidar);
    validarUnicidadCustodio(cajeroAValidar, !!sesionCajero);

    // BR-CAJ-009: aplica venga la base de la bóveda o de un fondo externo
    validarBaseAsignadaMaxima(dto.baseAsignada, caja.baseDia, caja.codigo);

    // Check if a general session is open — if so, debit from it (same as abrirAuxiliar)
    let sesionGeneral: Awaited<ReturnType<typeof this.sesionesRepo.findById>> = null;
    if (caja.cajaPadreId) {
      const cajaGeneral = await this.cajasRepo.findCajaGeneralByPadre(caja.cajaPadreId);
      if (cajaGeneral) {
        sesionGeneral = await this.sesionesRepo.findAbiertaByCaja(cajaGeneral.id);
      }
    }

    if (sesionGeneral) {
      const saldoPrincipal = await this.sesionesRepo.calcularSaldo(sesionGeneral.id);
      const baseResult = calcularBaseAsignadaAuxiliar(saldoPrincipal, dto.baseAsignada, false);
      const debito  = buildDebitoPrincipalPorApertura(baseResult.baseAsignada);
      const credito = buildCreditoAuxiliarPorApertura(baseResult.baseAsignada);

      const sesion = await this.sesionesRepo.crearSesion({
        cajaId,
        usuarioAperturaId: usuarioId,
        cajeroAsignadoId:  cajeroApertura,
        equipoMac:         dto.equipoMac,
        montoApertura:     '0',
      });

      await this.sesionesRepo.registrarTransferenciaAtomica(
        { sesionCajaId: sesionGeneral.id, tipo: debito.tipoMovimiento,  monto: debito.monto,  descripcion: `Apertura directa ${caja.codigo}` },
        { sesionCajaId: sesion.id,        tipo: credito.tipoMovimiento, monto: credito.monto, descripcion: `Base asignada desde principal` },
      );
      this.realtime?.broadcast('cajas.sesion.abierta', { cajaId });
      this.auditCaja('CREATE', 'apertura_directa', sesion.id, usuarioId, {
        caja_id:    cajaId,
        caja_codigo: caja.codigo,
        cajero_id:  cajeroApertura,
        equipo_mac: dto.equipoMac ?? null,
        con_principal: true,
      });
      return sesion;
    }

    // No general session — truly standalone opening (external base)
    // BR-CAJ-011: la suma de bases standalone en el punto no puede superar la base general
    if (caja.cajaPadreId) {
      const padre = await this.cajasRepo.findPadreById(caja.cajaPadreId);
      const baseGeneral = Number(padre?.baseGeneral ?? '0');
      if (baseGeneral > 0) {
        const sesionesAbiertas = await this.sesionesRepo.findAbiertasByPunto(caja.cajaPadreId);
        const sumBase = sesionesAbiertas.reduce((acc, s) => acc + Number(s.montoApertura), 0);
        if (sumBase + Number(dto.baseAsignada) > baseGeneral) {
          throw new BasePuntoInsuficienteError(
            (sumBase + Number(dto.baseAsignada)).toFixed(2),
            padre!.baseGeneral,
          );
        }
      }
    }

    const sesion = await this.sesionesRepo.crearSesion({
      cajaId,
      usuarioAperturaId: usuarioId,
      cajeroAsignadoId:  cajeroApertura,
      equipoMac:         dto.equipoMac,
      montoApertura:     dto.baseAsignada,
    });

    await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesion.id,
      tipo:         'apertura',
      monto:        dto.baseAsignada,
      descripcion:  `Apertura ${caja.nombre}`,
    });

    this.realtime?.broadcast('cajas.sesion.abierta', { cajaId });
    this.auditCaja('CREATE', 'apertura_directa', sesion.id, usuarioId, {
      caja_id:    cajaId,
      caja_codigo: caja.codigo,
      cajero_id:  cajeroApertura,
      equipo_mac: dto.equipoMac ?? null,
      con_principal: false,
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

    if (dto.cajeroAsignadoId) this.assertCajaAsignable(caja);

    const cajeroApertura = resolverCajeroDeApertura(caja.tipo, dto.cajeroAsignadoId, caja.cajeroFijoId);
    if (requiereCajero(caja.tipo, cajeroApertura)) throw new CajaSinCajeroError(caja.codigo);

    if (cajeroApertura) {
      const sesionCajero = await this.sesionesRepo.findAbiertaByCajero(cajeroApertura);
      validarUnicidadCustodio(cajeroApertura, !!sesionCajero);
    }

    validarBaseAsignadaMaxima(dto.baseAsignada, caja.baseDia, caja.codigo);

    const saldoPrincipal = await this.sesionesRepo.calcularSaldo(sesionPrincipalId);
    const baseResult   = calcularBaseAsignadaAuxiliar(saldoPrincipal, dto.baseAsignada, false);
    const debito       = buildDebitoPrincipalPorApertura(baseResult.baseAsignada);
    const credito      = buildCreditoAuxiliarPorApertura(baseResult.baseAsignada);

    // RF-3.02: monto_apertura='0' porque el saldo inicial llega vía cambio_custodia_in.
    // Si se pusiera baseAsignada aquí Y en el movimiento, calcularSaldo daría 2×base.
    const nuevaSesion = await this.sesionesRepo.crearSesion({
      cajaId:            dto.cajaAuxiliarId,
      usuarioAperturaId: usuarioId,
      cajeroAsignadoId:  cajeroApertura,
      equipoMac:         dto.equipoMac,
      montoApertura:     '0',
    });

    await this.sesionesRepo.registrarTransferenciaAtomica(
      {
        sesionCajaId: sesionPrincipalId,
        tipo:         debito.tipoMovimiento,
        monto:        debito.monto,
        descripcion:  `Apertura caja auxiliar ${caja.codigo}`,
      },
      {
        sesionCajaId: nuevaSesion.id,
        tipo:         credito.tipoMovimiento,
        monto:        credito.monto,
        descripcion:  `Base asignada desde principal`,
      },
    );

    await this.sesionesRepo.crearReposicion({
      sesionOrigenId:  sesionPrincipalId,
      sesionDestinoId: nuevaSesion.id,
      monto:           dto.baseAsignada,
      usuarioId,
      estado:          'aprobada',
      motivo:          'apertura_auxiliar',
    });

    this.realtime?.broadcast('cajas.sesion.abierta', { cajaId: dto.cajaAuxiliarId });
    this.auditCaja('CREATE', 'apertura_auxiliar', nuevaSesion.id, usuarioId, {
      caja_id:           dto.cajaAuxiliarId,
      caja_codigo:       caja.codigo,
      cajero_id:         cajeroApertura,
      sesion_principal_id: sesionPrincipalId,
      equipo_mac:        dto.equipoMac ?? null,
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
    const arqueoComparacion = dto.denominaciones?.length
      ? compararArqueoConSaldo(dto.denominaciones, saldoEsperado)
      : null;
    const totalArqueo = arqueoComparacion
      ? arqueoComparacion.total
      : Number(dto.totalArqueo).toFixed(2);
    const diferencia = Number(totalArqueo) - Number(saldoEsperado);

    const { debeForzar } = evaluarCierreForzado(sesion.fechaApertura, new Date(), 24);

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
      // C2: la devolución a principal usa el saldo electrónico, no el arqueo.
      // RF-3.02: si la sesión fue abierta con montoApertura > 0 (abrirCajaDirecta
      // standalone sin sesión general activa), ese monto no salió de la caja general
      // → solo se transfiere la ganancia neta de movimientos para evitar inflar el
      // saldo del principal con fondos que nunca estuvieron en él.
      // Para sesiones abiertas via abrirAuxiliar o abrirCajaDirecta-con-general,
      // montoApertura='0' por lo que saldoNeto === saldoEsperado.
      const saldoNeto = Math.max(
        0,
        Number(saldoEsperado) - Number(sesion.montoApertura),
      ).toFixed(2);

      if (Number(saldoNeto) > 0) {
        const devolucion = calcularDevolucionAPrincipal(saldoNeto);
        await this.sesionesRepo.registrarTransferenciaAtomica(
          {
            sesionCajaId: sesionAuxiliarId,
            tipo:         devolucion.movimientoAuxiliar.tipoMovimiento,
            monto:        devolucion.monto,
            descripcion:  'Cierre auxiliar — entrega a principal',
          },
          {
            sesionCajaId: sesionGeneral.id,
            tipo:         devolucion.movimientoPrincipal.tipoMovimiento,
            monto:        devolucion.monto,
            descripcion:  `Cierre auxiliar ${sesion.cajaId} — recepción`,
          },
        );
        await this.sesionesRepo.crearReposicion({
          sesionOrigenId:  sesionAuxiliarId,
          sesionDestinoId: sesionGeneral.id,
          monto:           devolucion.monto,
          usuarioId,
          estado:          'aprobada',
          motivo:          'cierre_auxiliar',
        });
      }
    }

    // RF-3.03: diferencia NO se aplica al saldo inmediatamente — queda pendiente de
    // aprobación del supervisor (SoD: aprobador ≠ custodio). El movimiento se registra
    // en la sesión cerrada solo cuando el supervisor resuelve la DiferenciaCaja.
    let diferenciaCierre: { id: number; tipo: 'sobrante' | 'faltante'; monto: string } | null = null;
    if (Math.abs(diferencia) > 0.01) {
      const difResult = diferencia > 0
        ? calcularDiferenciaSobrante(saldoEsperado, totalArqueo)
        : calcularDiferenciaFaltante(saldoEsperado, totalArqueo);
      const tipoDif = 'sobrante' in difResult ? 'sobrante' : 'faltante';
      const montoDif = 'sobrante' in difResult ? difResult.sobrante : difResult.faltante;
      const registro = await this.sesionesRepo.crearDiferencia({
        sesionCajaId:  sesionAuxiliarId,
        tipoDiferencia: tipoDif,
        monto:          montoDif,
        custodioId:     sesion.cajeroAsignadoId ?? sesion.usuarioAperturaId,
        observaciones:  `Cierre auxiliar — esperado $${saldoEsperado}, arqueo $${totalArqueo}`,
      });
      diferenciaCierre = { id: registro.id, tipo: tipoDif, monto: montoDif };
    }

    const sesionCerrada = await this.sesionesRepo.cerrarSesion(sesionAuxiliarId, {
      usuarioCierreId: usuarioId,
      montoCierre:     totalArqueo,
      arqueo:          dto.denominaciones,
      observaciones:   dto.observaciones,
      forzado:         debeForzar,
    });

    this.realtime?.broadcast('cajas.sesion.cerrada', { sesionId: sesionAuxiliarId });
    this.auditCaja('UPDATE', 'cierre_auxiliar', sesionAuxiliarId, usuarioId, {
      caja_id:          sesion.cajaId,
      cajero_id:        sesion.cajeroAsignadoId ?? sesion.usuarioAperturaId,
      hubo_diferencia:  diferenciaCierre !== null,
      forzado:          debeForzar,
      duracion_minutos: Math.round((Date.now() - sesion.fechaApertura.getTime()) / 60_000),
    });
    return { sesion: sesionCerrada, diferenciaCierre, forzado: debeForzar, arqueoComparacion };
  }

  // ── Cambio de custodia — RF-4.01 Two-Phase Transfer ─────────────────────────
  // Fase 1 (EMITIR): El dinero sale del origen y queda en tránsito.
  // Genera un codigo_remesa inmutable (RF-4.02) que el receptor debe ingresar.

  async cambioCustodia(sesionOrigenId: number, dto: CambioCustodiaDto, usuarioId: number) {
    const sesionOrigen = await this.sesionesRepo.findById(sesionOrigenId);
    if (!sesionOrigen) throw new SesionNoEncontradaError(sesionOrigenId);
    validarSesionAbierta(sesionOrigenId, sesionOrigen.estado);

    const sesionDestino = await this.sesionesRepo.findById(dto.sesionDestinoId);
    if (!sesionDestino) throw new SesionNoEncontradaError(dto.sesionDestinoId);
    validarSesionAbierta(dto.sesionDestinoId, sesionDestino.estado);

    const saldoOrigen = await this.sesionesRepo.calcularSaldo(sesionOrigenId);
    const custodia = calcularCambioCustodiaEnSesion(dto.monto, saldoOrigen);

    // RF-4.02: hash de 16 caracteres derivado de los parámetros del traspaso.
    // Inmutable: se genera una sola vez y no puede modificarse (RNF-5.01).
    const timestamp = Date.now();
    const codigoRemesa = crypto
      .createHash('sha256')
      .update(`${sesionOrigenId}-${dto.sesionDestinoId}-${dto.monto}-${timestamp}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    // Fase 1: solo se registra la SALIDA del origen; el destino recibe cuando confirme.
    await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionOrigenId,
      tipo:         custodia.movimientoPrincipal.tipoMovimiento,
      monto:        custodia.movimientoPrincipal.monto,
      descripcion:  `[REMESA:${codigoRemesa}] ${dto.motivo ?? 'cambio_custodia'} — EN TRÁNSITO`,
    });

    const reposicion = await this.sesionesRepo.crearReposicion({
      sesionOrigenId,
      sesionDestinoId: dto.sesionDestinoId,
      monto:           dto.monto,
      usuarioId,
      estado:          'en_transito',
      motivo:          dto.motivo ?? 'cambio_custodia',
      codigoRemesa,
    });

    const saldoOrigen2 = await this.sesionesRepo.calcularSaldo(sesionOrigenId);
    const cajaOrigen  = await this.cajasRepo.findById(sesionOrigen.cajaId);
    const alertas = evaluarAlertas(saldoOrigen2, cajaOrigen?.baseDia ?? '0', cajaOrigen?.limiteAlerta ?? null);

    return {
      reposicionId:  reposicion.id,
      codigoRemesa,
      montoEmitido:  dto.monto,
      saldoOrigen:   saldoOrigen2,
      alertas,
      estado:        'en_transito' as const,
    };
  }

  // Fase 2 (CONFIRMAR): El receptor verifica el dinero físico e ingresa el código.
  // RF-4.01 S3: si montoRecibido === montoEmitido → CONFIRMADO (saldo acreditado).
  // Si hay discrepancia → DiscrepanciaTransitoError (queda en_transito para auditoría).

  async confirmarCustodia(codigoRemesa: string, montoRecibido: string, receptorId: number) {
    const reposicion = await this.sesionesRepo.findReposicionByCodigo(codigoRemesa);
    if (!reposicion) throw new ReposicionNoEncontradaError(codigoRemesa);
    if (reposicion.estado !== 'en_transito') throw new ReposicionEstadoInvalidoError(reposicion.estado);

    if (Math.abs(Number(montoRecibido) - Number(reposicion.monto)) > 0.01) {
      throw new DiscrepanciaTransitoError(reposicion.monto, montoRecibido);
    }

    const sesionDestino = await this.sesionesRepo.findById(reposicion.sesionDestinoId);
    if (!sesionDestino) throw new SesionNoEncontradaError(reposicion.sesionDestinoId);
    validarSesionAbierta(reposicion.sesionDestinoId, sesionDestino.estado);

    // Acreditar en el destino y marcar confirmada en una sola transacción ACID (RNF-5.02).
    // Si la BD cae entre los dos pasos, ninguno se aplica — la reposición permanece
    // en_transito y puede reintentarse sin duplicar el crédito.
    const confirmada = await this.sesionesRepo.confirmarCustodiaAtomica(
      reposicion.id,
      {
        sesionCajaId: reposicion.sesionDestinoId,
        tipo:         'cambio_custodia_in',
        monto:        reposicion.monto,
        descripcion:  `[REMESA:${codigoRemesa}] Recibido y confirmado por receptor ${receptorId}`,
      },
      receptorId,
    );

    const cajaDestino = await this.cajasRepo.findById(sesionDestino.cajaId);
    const nuevoSaldo  = await this.sesionesRepo.calcularSaldo(reposicion.sesionDestinoId);
    const alertas = evaluarAlertas(nuevoSaldo, cajaDestino?.baseDia ?? '0', cajaDestino?.limiteAlerta ?? null);

    return { reposicion: confirmada, saldoDestino: nuevoSaldo, alertas };
  }

  // ── Consignación ─────────────────────────────────────────────────────────────

  async registrarConsignacion(sesionId: number, dto: ConsignacionDto, usuarioId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const saldo = await this.sesionesRepo.calcularSaldo(sesionId);
    try {
      validarMontoConsignacion(dto.monto, saldo);
    } catch (e: unknown) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Monto inválido');
    }

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

  async getConsignaciones(sesionId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    return this.sesionesRepo.findConsignacionesBySesion(sesionId);
  }

  async registrarMedioPago(
    sesionId: number,
    dto: { tipo: 'transferencia' | 'cheque'; valor: string; descripcion?: string; numeroCheque?: string },
    usuarioId: number,
  ) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const mov = await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionId,
      tipo:         'recaudo',
      monto:        dto.valor,
      medioPago:    dto.tipo as 'transferencia' | 'cheque',
      descripcion:  dto.descripcion ?? (dto.tipo === 'cheque' && dto.numeroCheque ? `Cheque #${dto.numeroCheque}` : undefined),
    });

    const saldo   = await this.sesionesRepo.calcularSaldo(sesionId);
    const caja    = await this.cajasRepo.findById(sesion.cajaId);
    const alertas = evaluarAlertas(saldo, caja?.baseDia ?? '0', caja?.limiteAlerta ?? null);

    this.realtime?.broadcast('cajas.movimiento', { sesionId, tipo: dto.tipo });
    return { movimiento: mov, saldoDespues: saldo, alertas };
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
      const impacto = buildImpactoConsignacionAprobada(
        consignacion.monto,
        consignacion.sesionCajaId,
        new Date(),
      );
      await this.sesionesRepo.registrarMovimiento({
        sesionCajaId: impacto.sesionCajaId,
        tipo:         impacto.tipoMovimiento,
        monto:        impacto.monto,
        descripcion:  `Consignación aprobada #${id}`,
      });
    }

    if (dto.estado === 'aprobada') this.realtime?.broadcast('cajas.consignacion', { id, estado: dto.estado });
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

  // ── Ajuste por moneda circulante (redondeos CIPOS acumulados) ───────────────

  async registrarAjusteMonedaCirculante(sesionId: number, acumuladoCentavos: string) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const ajuste = calcularMonedaCirculante(acumuladoCentavos);
    if (Number(ajuste.monto) === 0) {
      return null;
    }

    return this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionId,
      tipo:         ajuste.tipoMovimiento,
      monto:        ajuste.monto,
      descripcion:  `Ajuste moneda circulante CIPOS: ${ajuste.esEntrada ? '+' : '-'}${ajuste.monto}`,
    });
  }

  // ── Pago administrativo ──────────────────────────────────────────────────────

  async registrarPagoAdministrativo(sesionId: number, dto: PagoAdministrativoDto) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const saldo = await this.sesionesRepo.calcularSaldo(sesionId);
    const descripcion = `${dto.tipoPago}${dto.numeroCaso ? ` caso #${dto.numeroCaso}` : ''}${dto.observacion ? ` — ${dto.observacion}` : ''}`;
    const pagoResult = buildPagoAdministrativo(dto.valor, descripcion, saldo);

    return this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionId,
      tipo:         pagoResult.tipoMovimiento,
      monto:        pagoResult.monto,
      descripcion:  pagoResult.descripcion,
    });
  }

  // ── Cierre de sesión principal ───────────────────────────────────────────────

  async cerrarSesionPrincipal(sesionPrincipalId: number, dto: CierreCajaDto, usuarioId: number) {
    const sesion = await this.sesionesRepo.findById(sesionPrincipalId);
    if (!sesion) throw new SesionNoEncontradaError(sesionPrincipalId);
    validarSesionAbierta(sesionPrincipalId, sesion.estado);

    const caja = await this.cajasRepo.findById(sesion.cajaId);
    if (!caja) throw new CajaNoEncontradaError(sesion.cajaId);

    const sesionesAbiertas = await this.sesionesRepo.findAbiertasByPunto(caja.cajaPadreId!);
    const auxiliaresAbiertas = sesionesAbiertas.filter(s => s.id !== sesionPrincipalId);
    if (auxiliaresAbiertas.length > 0) {
      throw new AuxiliaresAbiertasError(auxiliaresAbiertas.length);
    }

    const saldoEsperado = await this.sesionesRepo.calcularSaldo(sesionPrincipalId);
    const arqueoComparacion = dto.denominaciones?.length
      ? compararArqueoConSaldo(dto.denominaciones, saldoEsperado)
      : null;
    const totalArqueo = arqueoComparacion
      ? arqueoComparacion.total
      : Number(dto.totalArqueo).toFixed(2);
    const diferencia = Number(totalArqueo) - Number(saldoEsperado);

    const { debeForzar } = evaluarCierreForzado(sesion.fechaApertura, new Date(), 24);

    // RF-3.03: la diferencia queda en estado pendiente hasta aprobación del supervisor.
    let diferenciaCierre: { id: number; tipo: 'sobrante' | 'faltante'; monto: string } | null = null;
    if (Math.abs(diferencia) > 0.01) {
      const difResult = diferencia > 0
        ? calcularDiferenciaSobrante(saldoEsperado, totalArqueo)
        : calcularDiferenciaFaltante(saldoEsperado, totalArqueo);
      const tipoDif = 'sobrante' in difResult ? 'sobrante' : 'faltante';
      const montoDif = 'sobrante' in difResult ? difResult.sobrante : difResult.faltante;
      const registro = await this.sesionesRepo.crearDiferencia({
        sesionCajaId:   sesionPrincipalId,
        tipoDiferencia: tipoDif,
        monto:           montoDif,
        custodioId:      sesion.cajeroAsignadoId ?? sesion.usuarioAperturaId,
        observaciones:   `Cierre principal — esperado $${saldoEsperado}, arqueo $${totalArqueo}`,
      });
      diferenciaCierre = { id: registro.id, tipo: tipoDif, monto: montoDif };
    }

    const sesionCerrada = await this.sesionesRepo.cerrarSesion(sesionPrincipalId, {
      usuarioCierreId: usuarioId,
      montoCierre:     totalArqueo,
      arqueo:          dto.denominaciones,
      observaciones:   dto.observaciones,
      forzado:         debeForzar,
    });

    this.auditCaja('UPDATE', 'cierre_principal', sesionPrincipalId, usuarioId, {
      caja_id:         caja.id,
      caja_codigo:     caja.codigo,
      punto_id:        caja.cajaPadreId,
      hubo_diferencia: diferenciaCierre !== null,
      forzado:         debeForzar,
      duracion_minutos: Math.round((Date.now() - sesion.fechaApertura.getTime()) / 60_000),
    });
    return { sesion: sesionCerrada, diferenciaCierre, forzado: debeForzar, arqueoComparacion };
  }

  // ── Historial de sesiones por caja ───────────────────────────────────────────

  async getHistorialSesiones(cajaId: number) {
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);
    return this.sesionesRepo.findHistorialByCaja(cajaId, 20);
  }

  async getHistorialAlertas(cajaId: number) {
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);
    return this.sesionesRepo.findHistorialConAlertas(cajaId, 30);
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

  // Tesorería activa las franquicias por sucursal: una franquicia global pero apagada
  // en el punto no puede cobrarse allí.
  private async validarFranquiciaHabilitada(cajaId: number, franquiciaId: number) {
    if (!this.prisma) return;
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);
    const habilitada = await this.prisma.franquiciaSucursal.findFirst({
      where: {
        sucursales_idsucursales:    caja.sucursalId,
        franquicias_idfranquicias:  franquiciaId,
        activofranquicias_sucursal: true,
        franquicia: { activofranquicias: true, deleted_atfranquicias: null },
      },
      select: { franquicias_idfranquicias: true },
    });
    if (!habilitada) {
      throw new BadRequestException(`La franquicia ${franquiciaId} no está habilitada en esta sucursal`);
    }
  }

  async registrarMovimientoVenta(params: {
    sesionCajaId:    number;
    tipo:            TipoMovimientoCaja;
    monto:           string;
    medioPago?:      MedioPago;
    /** Porción del monto realmente recibida en efectivo (pagos mixtos con estampillas/preporteado/tarjeta) */
    montoEfectivo?:  string | number;
    referenciaId?:   number;
    referenciaTipo?: string;
    descripcion?:    string;
    /** Solo aplica a tarjeta_credito: franquicia del catálogo de Tesorería */
    franquiciaId?:   number;
    /** Baucher del datáfono — obligatorio para débito y crédito */
    codigoVoucher?:  string;
  }) {
    const sesion = await this.sesionesRepo.findById(params.sesionCajaId);
    if (!sesion) throw new SesionNoEncontradaError(params.sesionCajaId);
    validarSesionAbierta(params.sesionCajaId, sesion.estado);
    if (params.franquiciaId) await this.validarFranquiciaHabilitada(sesion.cajaId, params.franquiciaId);

    const partes = repartirPagoPorMedio(params.monto, params.medioPago, params.montoEfectivo);
    const [movimiento] = await this.sesionesRepo.registrarMovimientosAtomicos(
      partes.map(parte => ({
        sesionCajaId:   params.sesionCajaId,
        tipo:           params.tipo,
        monto:          parte.monto,
        medioPago:      parte.medioPago,
        referenciaId:   params.referenciaId,
        referenciaTipo: params.referenciaTipo,
        descripcion:    params.descripcion,
        // El baucher identifica la porción cobrada por datáfono; la parte en efectivo
        // del pago mixto no lleva franquicia ni código.
        franquiciaId:   esTarjeta(parte.medioPago) ? params.franquiciaId  : undefined,
        codigoVoucher:  esTarjeta(parte.medioPago) ? params.codigoVoucher : undefined,
      })),
    );

    const caja    = await this.cajasRepo.findById(sesion.cajaId);
    const saldo   = await this.sesionesRepo.calcularSaldo(params.sesionCajaId);
    const alertas = evaluarAlertas(saldo, caja?.baseDia ?? '0', caja?.limiteAlerta ?? null);

    return { movimiento, saldoActual: saldo, alertas };
  }

  // ── Diferencias de caja — RF-3.03 ───────────────────────────────────────────

  async getDiferencia(id: number) {
    const d = await this.sesionesRepo.findDiferenciaById(id);
    if (!d) throw new DiferenciaNoEncontradaError(id);
    return d;
  }

  async getDiferenciasPendientesBySucursal(sucursalId: number) {
    return this.sesionesRepo.findDiferenciasPendientesBySucursal(sucursalId);
  }

  async getDiferenciasBySucursal(sucursalId: number, filters: {
    tipo?:   'faltante' | 'sobrante';
    estado?: 'pendiente' | 'aprobada' | 'rechazada';
    desde?:  string;
    hasta?:  string;
    limite?: number;
    pagina?: number;
  }) {
    return this.sesionesRepo.findDiferenciasBySucursal(sucursalId, {
      tipo:   filters.tipo,
      estado: filters.estado,
      desde:  filters.desde ? new Date(`${filters.desde}T00:00:00Z`) : undefined,
      hasta:  filters.hasta ? new Date(`${filters.hasta}T23:59:59Z`) : undefined,
      limite: filters.limite ?? 100,
      pagina: filters.pagina ?? 1,
    });
  }

  async resolverDiferencia(
    id: number,
    aprobadorId: number,
    estado: 'aprobada' | 'rechazada',
    observaciones?: string,
  ) {
    const diferencia = await this.sesionesRepo.findDiferenciaById(id);
    if (!diferencia) throw new DiferenciaNoEncontradaError(id);
    if (diferencia.estado !== 'pendiente') throw new DiferenciaEstadoInvalidoError(diferencia.estado);

    // RF-1.03 SoD: el supervisor aprobador no puede ser el custodio responsable
    if (diferencia.custodioId !== null && aprobadorId === diferencia.custodioId) {
      throw new SoDViolacionError();
    }

    const resuelta = await this.sesionesRepo.resolverDiferencia(id, {
      aprobadorId,
      estado,
      observaciones,
    });

    // Si aprobada: registrar el movimiento contable en la sesión (ya cerrada) para audit trail
    if (estado === 'aprobada') {
      const tipo = diferencia.tipoDiferencia === 'faltante' ? 'diferencia_faltante' : 'diferencia_sobrante';
      await this.sesionesRepo.registrarMovimiento({
        sesionCajaId: diferencia.sesionCajaId,
        tipo,
        monto:        diferencia.monto,
        descripcion:  `RF-3.03 aprobado por supervisor ${aprobadorId}${observaciones ? ` — ${observaciones}` : ''}`,
      });
    }

    return resuelta;
  }

  // ── Consolidado comercio (todas las regionales) ──────────────────────────────

  async getConsolidadoComercio(comercioId: number) {
    const [porRegional, porSesion] = await Promise.all([
      this.sesionesRepo.getConsolidadoPorRegional(),
      this.sesionesRepo.getConsolidadoPorSesion(),
    ]);

    const regionales = porRegional.map(r => ({
      regionalId: r.regionalId,
      porMedio: {
        efectivo:         r.porMedio['efectivo']          ?? '0',
        tarjetaDebito:    r.porMedio['tarjeta_debito']    ?? '0',
        tarjetaCredito:   r.porMedio['tarjeta_credito']   ?? '0',
        transferencia:    r.porMedio['transferencia']     ?? '0',
        consignacion:     r.porMedio['consignacion']      ?? '0',
        preporteado:      r.porMedio['preporteado']       ?? '0',
        mixtoPreporteado: r.porMedio['mixto_preporteado'] ?? '0',
      },
    }));

    const sesiones = porSesion.map(s => {
      const pm = {
        efectivo:         s.porMedio['efectivo']          ?? '0',
        tarjetaDebito:    s.porMedio['tarjeta_debito']    ?? '0',
        tarjetaCredito:   s.porMedio['tarjeta_credito']   ?? '0',
        transferencia:    s.porMedio['transferencia']     ?? '0',
        consignacion:     s.porMedio['consignacion']      ?? '0',
        preporteado:      s.porMedio['preporteado']       ?? '0',
        mixtoPreporteado: s.porMedio['mixto_preporteado'] ?? '0',
      };
      const total = Object.values(pm).reduce((a, b) => a + Number(b), 0);
      return {
        sesionId:       s.sesionId,
        cajaId:         s.cajaId,
        cajaNombre:     s.cajaNombre,
        sucursalNombre: s.sucursalNombre,
        cajeroNombre:   s.cajeroNombre,
        total:          String(total),
        porMedio:       pm,
      };
    });

    return { ...consolidarComercio(comercioId, regionales), sesiones };
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
    return puedeOperarSesion(sesion, userId);
  }

  // RF-1.01: retorna la sucursalId de la caja asociada a una sesión (para scope de acceso)
  async getSucursalIdDeSesion(sesionId: number): Promise<number | null> {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    const caja = await this.cajasRepo.findById(sesion.cajaId);
    return caja?.sucursalId ?? null;
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

  async getAsignacionSucursal(sucursalId: number) {
    return this.cajasRepo.getAsignacionSucursal(sucursalId);
  }

  async setCajeroFijoCaja(cajaId: number, cajeroId: number | null) {
    const caja = await this.cajasRepo.findById(cajaId);
    if (!caja) throw new CajaNoEncontradaError(cajaId);
    // Retirar (null) siempre se permite: es la única salida si ya quedó mal asignada
    if (cajeroId !== null) {
      this.assertCajaAsignable(caja);
      const perfil = await this.perfilAsignable(cajeroId);
      if (!puedeSerCajeroDeCaja(perfil, caja.sucursalId)) {
        throw new UsuarioNoAsignableError(
          `${perfil.nombre} (${perfil.rol}) no puede ser cajero de ${caja.codigo}: ` +
          `la caja requiere un usuario con rol CAJERO destacado en esa sucursal.`,
        );
      }
    }
    await this.cajasRepo.setCajeroFijoCaja(cajaId, cajeroId);
  }

  async setSupervisorPunto(cajaPadreId: number, supervisorId: number | null) {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);
    if (supervisorId !== null) {
      const perfil = await this.perfilAsignable(supervisorId);
      if (!puedeSupervisarPunto(perfil, padre.sucursalId)) {
        throw new UsuarioNoAsignableError(
          `${perfil.nombre} (${perfil.rol}) no puede supervisar ${padre.nombre}: ` +
          `el punto requiere un SUPERVISOR_REGIONAL destacado en esa sucursal.`,
        );
      }
    }
    await this.cajasRepo.setSupervisorPunto(cajaPadreId, supervisorId);
  }

  private async perfilAsignable(usuarioId: number): Promise<PerfilUsuario> {
    const perfil = await this.cajasRepo.findPerfilUsuario(usuarioId);
    if (!perfil) {
      throw new UsuarioNoAsignableError(`El usuario ${usuarioId} no existe o está inactivo.`);
    }
    return perfil;
  }

  async setCajeroAsignado(sesionId: number, cajeroId: number | null) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    if (cajeroId !== null) {
      const caja = await this.cajasRepo.findById(sesion.cajaId);
      if (!caja) throw new CajaNoEncontradaError(sesion.cajaId);
      this.assertCajaAsignable(caja);

      const perfil = await this.perfilAsignable(cajeroId);
      if (!puedeSerCajeroDeCaja(perfil, caja.sucursalId)) {
        throw new UsuarioNoAsignableError(
          `${perfil.nombre} (${perfil.rol}) no puede ser cajero de ${caja.codigo}: ` +
          `la caja requiere un usuario con rol CAJERO destacado en esa sucursal.`,
        );
      }

      const sesionCajero = await this.sesionesRepo.findAbiertaByCajero(cajeroId);
      if (sesionCajero && sesionCajero.id !== sesionId) {
        validarUnicidadCustodio(cajeroId, true);
      }
    }

    return this.sesionesRepo.updateCajeroAsignado(sesionId, cajeroId);
  }

  // La Caja Fuerte y la Caja Menor son bolsillos de la caja principal: el responsable
  // es el supervisor del punto, así que darles un cajero propio parte la custodia.
  private assertCajaAsignable(caja: { codigo: string; tipo: TipoCaja }): void {
    if (!esCajaOperativa(caja.tipo)) {
      throw new CajaNoAsignableError(caja.codigo, caja.tipo);
    }
  }

  // ── Reset automático del punto (hora_reset diario — RF-3 / RNF-5.02) ────────
  // Cierra forzadamente todas las sesiones auxiliares abiertas del punto,
  // devolviendo su saldo contable a la caja fuerte principal. Las diferencias
  // de arqueo se omiten (el reset no hace arqueo físico) y las sesiones quedan
  // en estado 'forzada' para auditoría (RNF-5.01 ledger immutable).

  async resetAutomaticoPunto(cajaPadreId: number, usuarioId: number) {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);

    const cajaGeneral = await this.cajasRepo.findCajaGeneralByPadre(cajaPadreId);
    const sesionGeneral = cajaGeneral
      ? await this.sesionesRepo.findAbiertaByCaja(cajaGeneral.id)
      : null;

    const sesionesAbiertas = await this.sesionesRepo.findAbiertasByPunto(cajaPadreId);
    const auxiliaresAbiertas = sesionesAbiertas.filter(s => s.id !== sesionGeneral?.id);

    const cierres: Array<{
      sesionId: number;
      cajaId: number;
      saldoDevuelto: string;
    }> = [];

    for (const sesionAux of auxiliaresAbiertas) {
      const saldoAux = await this.sesionesRepo.calcularSaldo(sesionAux.id);
      const timestamp = new Date().toISOString();

      if (sesionGeneral && Number(saldoAux) > 0) {
        // RF-3.02: solo transferir la ganancia neta si la sesión fue abierta standalone
        // (montoApertura > 0 = base externa). Para sesiones abrirAuxiliar/abrirCajaDirecta-con-general
        // montoApertura='0' y montoTransferencia === saldoAux.
        const montoTransferencia = Math.max(
          0,
          Number(saldoAux) - Number(sesionAux.montoApertura),
        ).toFixed(2);

        if (Number(montoTransferencia) > 0) {
          // Movimientos pareados: auxiliar entrega a principal (RF-4.01 conservación de masa)
          await this.sesionesRepo.registrarTransferenciaAtomica(
            {
              sesionCajaId: sesionAux.id,
              tipo:         'cambio_custodia_out',
              monto:        montoTransferencia,
              descripcion:  `RESET AUTOMÁTICO ${timestamp} — entrega a principal`,
            },
            {
              sesionCajaId: sesionGeneral.id,
              tipo:         'cambio_custodia_in',
              monto:        montoTransferencia,
              descripcion:  `RESET AUTOMÁTICO ${timestamp} — recepción de caja ${sesionAux.cajaId}`,
            },
          );

          await this.sesionesRepo.crearReposicion({
            sesionOrigenId:  sesionAux.id,
            sesionDestinoId: sesionGeneral.id,
            monto:           montoTransferencia,
            usuarioId,
            estado:          'aprobada',
            motivo:          'reset_automatico',
          });
        }
      }

      // Estado 'forzada' deja trazabilidad diferenciada del cierre manual (RNF-5.01)
      await this.sesionesRepo.cerrarSesion(sesionAux.id, {
        usuarioCierreId: usuarioId,
        montoCierre:     saldoAux,
        forzado:         true,
        observaciones:   `Reset automático ${timestamp}`,
      });

      this.auditCaja('UPDATE', 'cierre_automatico', sesionAux.id, usuarioId, {
        caja_id:   sesionAux.cajaId,
        cajero_id: sesionAux.cajeroAsignadoId ?? sesionAux.usuarioAperturaId,
        punto_id:  cajaPadreId,
        forzado:   true,
        duracion_minutos: Math.round((Date.now() - sesionAux.fechaApertura.getTime()) / 60_000),
      });
      cierres.push({ sesionId: sesionAux.id, cajaId: sesionAux.cajaId, saldoDevuelto: saldoAux });
    }

    return { cajaPadreId, auxiliaresCerradas: cierres.length, cierres };
  }

  // ── Traslado a bóveda física (mid-session, RF-2.02 / RNF-5.02) ──────────────
  // El cajero mueve efectivo de su cajón a la bóveda física durante la sesión
  // (sin cerrar). Reduce el saldo operativo. Inmutable: solo append en MovimientoCaja
  // (RNF-5.01). Valida tope mínimo: no puede quedar por debajo de base_diacajas.

  async registrarTrasladoBoveda(sesionId: number, monto: string, usuarioId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const saldo = await this.sesionesRepo.calcularSaldo(sesionId);

    let trasladoResult: ReturnType<typeof calcularTrasladoCajaFuerte>;
    try {
      trasladoResult = calcularTrasladoCajaFuerte(monto, saldo);
    } catch (e: unknown) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Monto inválido para traslado');
    }

    const caja = await this.cajasRepo.findById(sesion.cajaId);

    // RF-2.02: el saldo resultante no puede caer por debajo del tope mínimo operativo
    if (caja && Number(trasladoResult.saldoDespues) < Number(caja.baseDia)) {
      throw new BadRequestException(
        `El traslado dejaría el saldo (${trasladoResult.saldoDespues}) por debajo del mínimo operativo (${caja.baseDia})`,
      );
    }

    const movimiento = await this.sesionesRepo.registrarMovimiento({
      sesionCajaId: sesionId,
      tipo:         'traslado_caja_fuerte',
      monto:        trasladoResult.monto,
      descripcion:  `Traslado a bóveda — usuario ${usuarioId} — ${new Date().toISOString()}`,
    });

    const alertas = evaluarAlertas(trasladoResult.saldoDespues, caja?.baseDia ?? '0', caja?.limiteAlerta ?? null);

    return { movimiento, saldoAntes: saldo, saldoDespues: trasladoResult.saldoDespues, alertas };
  }

  // ── Balance de Pagos ─────────────────────────────────────────────────────────

  async getBalancePagos(fechaInicio: Date, fechaFin: Date) {
    return this.sesionesRepo.getBalancePagos(fechaInicio, fechaFin);
  }

  // ── Alerta: sesiones que deben cerrarse automáticamente por horaReset ────────

  async getAlertasCierreAutomatico(sucursalId: number) {
    if (!this.prisma) return [];
    const ahora = new Date();

    const sesiones = await this.prisma.sesionCaja.findMany({
      where: {
        estadosesiones_caja: 'abierta',
        caja: { sucursales_idsucursales: sucursalId },
      },
      include: {
        caja: {
          include: {
            cajaPadre: { select: { idcajas_padres: true, hora_resetcajas_padres: true } },
          },
        },
      },
    });

    return sesiones
      .filter(s => {
        const horaReset = s.caja.cajaPadre?.hora_resetcajas_padres;
        if (!horaReset) return false;
        const reset = new Date(ahora);
        reset.setHours(horaReset.getHours(), horaReset.getMinutes(), 0, 0);
        return ahora >= reset;
      })
      .map(s => ({
        sesionId:      s.idsesiones_caja,
        cajaId:        s.cajas_idcajas,
        cajaNombre:    s.caja.nombrecajas,
        cajaPadreId:   s.caja.cajaPadre?.idcajas_padres ?? null,
        horaReset:     s.caja.cajaPadre?.hora_resetcajas_padres?.toISOString() ?? null,
        abiertaDesde:  s.fecha_aperturasesiones_caja,
      }));
  }

  // ── Capacidad del punto ──────────────────────────────────────────────────────

  async getCapacidadPunto(cajaPadreId: number) {
    const padre = await this.cajasRepo.findPadreById(cajaPadreId);
    if (!padre) throw new CajaPadreNoEncontradaError(cajaPadreId);

    const todasCajas = await this.cajasRepo.findBySucursal(padre.sucursalId);
    const auxiliares = todasCajas.filter(c => c.cajaPadreId === cajaPadreId && c.tipo !== 'general');

    const sesionesAbiertas = await this.sesionesRepo.findAbiertasByPunto(cajaPadreId);
    const auxiliaresAbiertas = sesionesAbiertas.filter(
      s => auxiliares.some(c => c.id === s.cajaId),
    ).length;

    const baseDias = auxiliares.map(c => Number(c.baseDia)).filter(b => b > 0);
    const baseMinimaAuxiliar = baseDias.length > 0 ? String(Math.min(...baseDias)) : padre.baseGeneral;

    return calcularCapacidadPunto(padre.baseGeneral, baseMinimaAuxiliar, auxiliaresAbiertas);
  }

  // ── Cajas habilitadas por sucursal ─────────────────────────────────────────

  async getCajasHabilitadas(sucursalId: number) {
    const cajas = await this.cajasRepo.findBySucursal(sucursalId);
    const infoList = await Promise.all(
      cajas.map(async c => ({
        cajaId:         c.id,
        tipo:           c.tipo,
        activaEnSesion: !!(await this.sesionesRepo.findAbiertaByCaja(c.id)),
      })),
    );
    return calcularCajasHabilitadas(infoList);
  }

  // ── Saldo de la caja fuerte (sesión general del punto) ─────────────────────

  async getSaldoCajaFuerte(cajaPadreId: number) {
    const cajaGeneral = await this.cajasRepo.findCajaGeneralByPadre(cajaPadreId);
    if (!cajaGeneral) return { saldo: '0.00', sesionActiva: false };

    const sesionGeneral = await this.sesionesRepo.findAbiertaByCaja(cajaGeneral.id);
    if (!sesionGeneral) return { saldo: '0.00', sesionActiva: false, cajaPadreId };

    const movimientos = await this.sesionesRepo.getMovimientos(sesionGeneral.id);

    // devolucionesAuxiliares: entradas procedentes del cierre de cajas auxiliares
    const devolucionesAuxiliares = movimientos
      .filter(m => m.tipo === 'cambio_custodia_in')
      .map(m => m.monto);

    const movimientosDirectos = movimientos
      .filter(m => m.tipo !== 'cambio_custodia_in')
      .map(m => ({ monto: m.monto, esEntrada: TIPOS_MOVIMIENTO_ENTRADA.has(m.tipo) }));

    const saldo = calcularSaldoCajaFuerte(
      sesionGeneral.montoApertura,
      movimientosDirectos,
      devolucionesAuxiliares,
    );

    return { saldo, sesionId: sesionGeneral.id, cajaPadreId, sesionActiva: true };
  }

  // ── Reposición sugerida para una sesión auxiliar ───────────────────────────

  async getReposicionSugerida(sesionId: number) {
    const sesion = await this.sesionesRepo.findById(sesionId);
    if (!sesion) throw new SesionNoEncontradaError(sesionId);
    validarSesionAbierta(sesionId, sesion.estado);

    const caja    = await this.cajasRepo.findById(sesion.cajaId);
    if (!caja) throw new CajaNoEncontradaError(sesion.cajaId);

    const saldoActual = await this.sesionesRepo.calcularSaldo(sesionId);
    return calcularReposicionCaja(saldoActual, caja.baseDia);
  }
}
