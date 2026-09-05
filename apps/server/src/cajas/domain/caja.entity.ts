import type { ServicioCajaItem } from './servicios-caja.js';

export type TipoCaja = 'menor' | 'general' | 'pos' | 'pagos';
export type EstadoSesionCaja = 'abierta' | 'cerrada' | 'forzada';
export type TipoMovimientoCaja =
  | 'apertura' | 'cierre'
  | 'venta_producto' | 'venta_servicio' | 'venta_estampilla' | 'apartado_postal'
  | 'giro_pago' | 'giro_emision_cobro'
  | 'consignacion' | 'reposicion'
  | 'cambio_custodia_in' | 'cambio_custodia_out'
  | 'diferencia_faltante' | 'diferencia_sobrante'
  | 'anulacion' | 'recaudo'
  | 'pago_administrativo' | 'traslado_caja_fuerte'
  | 'moneda_circulante';
export type MedioPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'consignacion' | 'cheque' | 'preporteado' | 'mixto_preporteado' | 'estampilla';
export type MedioConsignacion = 'banco' | 'transportadora';
export type TipoCuentaBancaria = 'ahorros' | 'corriente';
export type EstadoAprobacion = 'pendiente' | 'aprobada' | 'rechazada' | 'en_transito' | 'confirmada';
export type TipoDiferencia  = 'faltante' | 'sobrante';
export type TipoAlerta = 'reposicion_caja' | 'limite_efectivo_caja' | 'cierre_automatico';

export class CajaEntity {
  id: number;
  sucursalId: number;
  cajaPadreId: number | null;
  codigo: string;
  nombre: string;
  tipo: TipoCaja;
  baseDia: string;
  limiteAlerta: string | null;
  tTarget: string | null;
  activo: boolean;
  cajeroFijoId: number | null;
}

export class CajaPadreEntity {
  id: number;
  sucursalId: number;
  nombre: string;
  baseGeneral: string;
  horaReset: Date | null;
  supervisorId: number | null;
  supervisorNombre: string | null;
  supervisorEmail: string | null;
}

export class SesionCajaEntity {
  id: number;
  cajaId: number;
  usuarioAperturaId: number;
  usuarioCierreId: number | null;
  cajeroAsignadoId: number | null;
  equipoMac: string | null;
  montoApertura: string;
  montoCierre: string | null;
  fechaApertura: Date;
  fechaCierre: Date | null;
  cierreForzado: boolean;
  estado: EstadoSesionCaja;
  observaciones: string | null;
  arqueo?: ArqueoDenominacion[] | null;
  // populated on demand
  saldoActual?: string;
  alertas?: TipoAlerta[];
  caja?: CajaEntity;
}

export class MovimientoCajaEntity {
  id: number;
  sesionCajaId: number;
  tipo: TipoMovimientoCaja;
  monto: string;
  medioPago: MedioPago | null;
  referenciaId: number | null;
  referenciaTipo: string | null;
  descripcion: string | null;
  franquiciaId: number | null;
  codigoVoucher: string | null;
  createdAt: Date;
}

export class ConsignacionEntity {
  id: number;
  sesionCajaId: number;
  usuarioId: number;
  medio: MedioConsignacion;
  bancoNombre: string | null;
  tipoCuenta: TipoCuentaBancaria | null;
  numeroCuenta: string | null;
  monto: string;
  proposito: string | null;
  soporteUrl: string | null;
  estado: EstadoAprobacion;
  aprobadorId: number | null;
  fechaAprobacion: Date | null;
  createdAt: Date;
}

export class ReposicionCajaEntity {
  id: number;
  sesionOrigenId: number;
  sesionDestinoId: number;
  monto: string;
  usuarioId: number | null;
  estado: EstadoAprobacion;
  motivo: string | null;
  codigoRemesa: string | null;
  createdAt: Date;
}

export class DiferenciaCajaEntity {
  id: number;
  sesionCajaId: number;
  tipoDiferencia: TipoDiferencia;
  monto: string;
  custodioId: number | null;
  estado: EstadoAprobacion;
  aprobadorId: number | null;
  observaciones: string | null;
  createdAt: Date;
}

export interface ArqueoDenominacion {
  denominacion: number;
  tipo: 'billete' | 'moneda';
  cantidad: number;
  valorTotal: number;
}

export interface PanelPunto {
  baseGeneral: string;
  cajaGeneral: string;
  cajaFuerteGeneral: string;
  basePagos: string;
  cajaPagos: string;
  cajaFuertePagos: string;
  acumuladoMonedaCirculante: string;
  /** Σ montos de reposiciones con estado=en_transito en este punto (RF-4.01) */
  tTransito: string;
  /** Base restante que puede asignarse a nuevas cajas auxiliares (BR-CAJ-011) */
  baseDisponible: string;
  debeReset: boolean;
  horaReset: string | null;
}

export interface CardAuxiliar {
  cajaId: number;
  sesionId: number | null;
  codigo: string;
  nombre: string;
  tipo: TipoCaja;
  cajeroId: number | null;
  /** Quién opera la caja ahora mismo. Resuelve la misma cadena que cajeroId:
   *  cajero asignado a la sesión → cajero fijo de la caja → quien la abrió. */
  cajeroNombre: string | null;
  cajeroEmail: string | null;
  cajeroFijoId: number | null;
  estado: EstadoSesionCaja | 'sin_sesion';
  /** Balance de la caja fuerte del auxiliar (= saldo de la sesión activa) */
  saldoActual: string | null;
  baseDia: string;
  limiteAlerta: string | null;
  /** Nivel óptimo de liquidez configurado por tesorería (T_target, RF-2.01) */
  tTarget: string | null;
  /** Monto recomendado para reposición: tTarget − saldoActual. null si no aplica alerta o no hay tTarget */
  deltaReposicion: string | null;
  ingresosSesion: string;
  egresosSesion: string;
  saldoPorMedioPago: Record<MedioPago, string>;
  girosCount: number;
  girosValor: string;
  alertas: TipoAlerta[];
  /** Operaciones habilitadas por el supervisor en esta caja */
  servicios: ServicioCajaItem[];
}

export interface StatusPunto {
  sucursalId: number;
  cajaPadreId: number;
  panel: PanelPunto;
  cajas: CardAuxiliar[];
}

export interface ServicioSucursalItem {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export interface PerfilUsuario {
  id:         number;
  nombre:     string;
  rol:        string;
  sucursalId: number | null;
}

export interface CajaPosPanel {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoCaja;
  sesionActiva: boolean;
  sesionId: number | null;
}

// ── Asignación de cajeros por sucursal ────────────────────────────────────────

export interface CajaAsignacionSesion {
  sesionId:         number;
  estado:           EstadoSesionCaja;
  supervisorId:     number;
  supervisorNombre: string;
  cajeroId:         number | null;
  cajeroNombre:     string | null;
  cajeroEmail:      string | null;
  fechaApertura:    Date;
}

export interface CajaAsignacion {
  id:                 number;
  codigo:             string;
  nombre:             string;
  tipo:               TipoCaja;
  activo:             boolean;
  cajeroFijoId:       number | null;
  cajeroFijoNombre:   string | null;
  cajeroFijoEmail:    string | null;
  sesionActiva:       CajaAsignacionSesion | null;
}

export interface AsignacionSucursal {
  cajaPadreId:      number | null;
  cajaPadreNombre:  string | null;
  supervisorId:     number | null;
  supervisorNombre: string | null;
  supervisorEmail:  string | null;
  cajas:            CajaAsignacion[];
}

export interface SucursalPanelItem {
  sucursalId:     number;
  codigo:         string;
  nombre:         string;
  tipo:           string;
  regional:       string;
  ciudad:         string | null;
  departamento:   string | null;
  cajas:          CajaPosPanel[];
  servicios:      ServicioSucursalItem[];
}

export interface BalancePagosRow {
  regional:                 string;
  punto:                    string;
  fecha:                    string; // YYYY-MM-DD
  reposicionBanco:          string;
  reposicionTransportadora: string;
  reposicionCheque:         string;
  cantidadColpensiones:     number;
}
