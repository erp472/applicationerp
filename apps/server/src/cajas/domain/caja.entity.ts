export type TipoCaja = 'menor' | 'general' | 'pos' | 'pagos';
export type EstadoSesionCaja = 'abierta' | 'cerrada' | 'forzada';
export type TipoMovimientoCaja =
  | 'apertura' | 'cierre'
  | 'venta_producto' | 'venta_servicio' | 'venta_estampilla' | 'apartado_postal'
  | 'giro_pago' | 'giro_emision_cobro'
  | 'consignacion' | 'reposicion'
  | 'cambio_custodia_in' | 'cambio_custodia_out'
  | 'diferencia_faltante' | 'diferencia_sobrante'
  | 'anulacion' | 'recaudo' | 'moneda_circulante'
  | 'pago_administrativo' | 'traslado_caja_fuerte';
export type MedioPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'consignacion' | 'preporteado' | 'mixto_preporteado';
export type MedioConsignacion = 'banco' | 'transportadora';
export type TipoCuentaBancaria = 'ahorros' | 'corriente';
export type EstadoAprobacion = 'pendiente' | 'aprobada' | 'rechazada';
export type TipoAlerta = 'reposicion_caja' | 'limite_efectivo_caja';

export class CajaEntity {
  id: number;
  sucursalId: number;
  cajaPadreId: number | null;
  codigo: string;
  nombre: string;
  tipo: TipoCaja;
  baseDia: string;
  limiteAlerta: string | null;
  activo: boolean;
}

export class CajaPadreEntity {
  id: number;
  sucursalId: number;
  nombre: string;
  baseGeneral: string;
  horaReset: Date | null;
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
}

export interface CardAuxiliar {
  cajaId: number;
  sesionId: number | null;
  codigo: string;
  nombre: string;
  tipo: TipoCaja;
  cajeroId: number | null;
  estado: EstadoSesionCaja | 'sin_sesion';
  /** Balance de la caja fuerte del auxiliar (= saldo de la sesión activa) */
  saldoActual: string | null;
  baseDia: string;
  limiteAlerta: string | null;
  ingresosTurno: string;
  egresosTurno: string;
  girosCount: number;
  girosValor: string;
  alertas: TipoAlerta[];
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

export interface CajaPosPanel {
  id: number;
  codigo: string;
  nombre: string;
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
  id:           number;
  codigo:       string;
  nombre:       string;
  tipo:         TipoCaja;
  activo:       boolean;
  sesionActiva: CajaAsignacionSesion | null;
}

export interface AsignacionSucursal {
  cajaPadreId:   number | null;
  cajaPadreNombre: string | null;
  cajas:         CajaAsignacion[];
}

export interface SucursalPanelItem {
  sucursalId:     number;
  codigo:         string;
  nombre:         string;
  tipo:           string;
  regional:       string;
  ciudad:         string | null;
  departamento:   string | null;
  cajaPos:        CajaPosPanel | null;
  servicios:      ServicioSucursalItem[];
}
