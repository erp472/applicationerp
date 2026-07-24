import type {
  SesionCajaEntity,
  MovimientoCajaEntity,
  ConsignacionEntity,
  ReposicionCajaEntity,
  StatusPunto,
  TipoMovimientoCaja,
  MedioPago,
  MedioConsignacion,
  TipoCuentaBancaria,
  EstadoAprobacion,
  ArqueoDenominacion,
} from './caja.entity.js';

export const SESIONES_CAJA_REPOSITORY = Symbol('SESIONES_CAJA_REPOSITORY');

export interface CrearSesionData {
  cajaId: number;
  usuarioAperturaId: number;
  cajeroAsignadoId?: number;
  equipoMac?: string;
  montoApertura: string;
}

export interface CerrarSesionData {
  usuarioCierreId: number;
  montoCierre: string;
  arqueo?: ArqueoDenominacion[];
  observaciones?: string;
}

export interface RegistrarMovimientoData {
  sesionCajaId: number;
  tipo: TipoMovimientoCaja;
  monto: string;
  medioPago?: MedioPago;
  referenciaId?: number;
  referenciaTipo?: string;
  descripcion?: string;
}

export interface CrearReposicionData {
  sesionOrigenId: number;
  sesionDestinoId: number;
  monto: string;
  usuarioId?: number;
  estado: EstadoAprobacion;
  motivo?: string;
}

export interface CrearConsignacionData {
  sesionCajaId: number;
  usuarioId: number;
  medio: MedioConsignacion;
  bancoNombre?: string;
  tipoCuenta?: TipoCuentaBancaria;
  numeroCuenta?: string;
  monto: string;
  proposito?: string;
  soporteUrl?: string;
}

export interface AprobarConsignacionData {
  aprobadorId: number;
  estado: 'aprobada' | 'rechazada';
}

export interface ISesionesCajaRepository {
  findById(id: number): Promise<SesionCajaEntity | null>;
  findAbiertaByCaja(cajaId: number): Promise<SesionCajaEntity | null>;
  findAbiertasByPunto(sucursalId: number): Promise<SesionCajaEntity[]>;

  calcularSaldo(sesionId: number): Promise<string>;
  calcularCajaGeneral(sucursalId: number): Promise<{ general: string; pagos: string }>;

  crearSesion(data: CrearSesionData): Promise<SesionCajaEntity>;
  cerrarSesion(sesionId: number, data: CerrarSesionData): Promise<SesionCajaEntity>;

  registrarMovimiento(data: RegistrarMovimientoData): Promise<MovimientoCajaEntity>;
  crearReposicion(data: CrearReposicionData): Promise<ReposicionCajaEntity>;

  crearConsignacion(data: CrearConsignacionData): Promise<ConsignacionEntity>;
  findConsignacionById(id: number): Promise<ConsignacionEntity | null>;
  aprobarConsignacion(id: number, data: AprobarConsignacionData): Promise<ConsignacionEntity>;

  getMovimientos(sesionId: number): Promise<MovimientoCajaEntity[]>;
  getStatusPunto(cajaPadreId: number): Promise<StatusPunto>;
}
