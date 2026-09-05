import type {
  SesionCajaEntity,
  MovimientoCajaEntity,
  ConsignacionEntity,
  ReposicionCajaEntity,
  DiferenciaCajaEntity,
  StatusPunto,
  TipoMovimientoCaja,
  TipoDiferencia,
  MedioPago,
  MedioConsignacion,
  TipoCuentaBancaria,
  EstadoAprobacion,
  ArqueoDenominacion,
  BalancePagosRow,
} from './caja.entity.js';
import type { CategoriaHistorico } from './business-rules.js';

export const SESIONES_CAJA_REPOSITORY = Symbol('SESIONES_CAJA_REPOSITORY');

export interface HistoricoFiltros {
  /** Ausente = todo el comercio. Presente = solo esa regional (supervisor). */
  regionalId?: number;
  sucursalId?: number;
  cajaId?:     number;
  categoria?:  CategoriaHistorico;
  desde?:      Date;
  hasta?:      Date;
  limite:      number;
  pagina:      number;
}

export interface HistoricoMovimientoItem {
  id:             number;
  fecha:          Date;
  categoria:      CategoriaHistorico;
  tipo:           string;
  monto:          string;
  medioPago:      string | null;
  descripcion:    string | null;
  sesionId:       number;
  sesionAbierta:  boolean;
  cajaId:         number;
  cajaNombre:     string;
  sucursalId:     number;
  sucursalNombre: string;
  regionalNombre: string;
  cajero:         string | null;
  ventaId:        number | null;
  ventaEstado:    string | null;
}

export interface DiferenciasFiltros {
  tipo?:     'faltante' | 'sobrante';
  estado?:   'pendiente' | 'aprobada' | 'rechazada';
  desde?:    Date;
  hasta?:    Date;
  limite?:   number;
  pagina?:   number;
}

export interface DiferenciaRegistroItem {
  id:            number;
  sesionCajaId:  number;
  cajaNombre:    string;
  tipoDiferencia: 'faltante' | 'sobrante';
  monto:         string;
  estado:        'pendiente' | 'aprobada' | 'rechazada';
  observaciones: string | null;
  createdAt:     Date;
}

export interface CrearSesionData {
  cajaId: number;
  usuarioAperturaId: number;
  cajeroAsignadoId?: number | null;
  equipoMac?: string;
  montoApertura: string;
}

export interface CerrarSesionData {
  usuarioCierreId: number;
  montoCierre: string;
  arqueo?: ArqueoDenominacion[];
  observaciones?: string;
  forzado?: boolean;
}

export interface RegistrarMovimientoData {
  sesionCajaId: number;
  tipo: TipoMovimientoCaja;
  monto: string;
  medioPago?: MedioPago;
  referenciaId?: number;
  referenciaTipo?: string;
  descripcion?: string;
  franquiciaId?: number;
  codigoVoucher?: string;
}

export interface CrearReposicionData {
  sesionOrigenId: number;
  sesionDestinoId: number;
  monto: string;
  usuarioId?: number;
  estado: EstadoAprobacion;
  motivo?: string;
  codigoRemesa?: string;
}

export interface CrearDiferenciaData {
  sesionCajaId: number;
  tipoDiferencia: TipoDiferencia;
  monto: string;
  custodioId?: number;
  observaciones?: string;
}

export interface AprobarDiferenciaData {
  aprobadorId: number;
  estado: 'aprobada' | 'rechazada';
  observaciones?: string;
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
  findAbiertaByCajero(cajeroId: number): Promise<SesionCajaEntity | null>;
  findAbiertasByPunto(cajaPadreId: number): Promise<SesionCajaEntity[]>;
  findHistorialByCaja(cajaId: number, limit?: number): Promise<SesionCajaEntity[]>;
  findHistorialConAlertas(cajaId: number, limit?: number): Promise<(SesionCajaEntity & { diferencias: { id: number; tipo: 'faltante' | 'sobrante'; monto: string; estado: string; createdAt: string }[] })[]>;

  calcularSaldo(sesionId: number): Promise<string>;
  calcularCajaGeneral(sucursalId: number): Promise<{ general: string; pagos: string }>;

  crearSesion(data: CrearSesionData): Promise<SesionCajaEntity>;
  cerrarSesion(sesionId: number, data: CerrarSesionData): Promise<SesionCajaEntity>;

  registrarMovimiento(data: RegistrarMovimientoData): Promise<MovimientoCajaEntity>;
  registrarMovimientosAtomicos(movimientos: RegistrarMovimientoData[]): Promise<MovimientoCajaEntity[]>;
  registrarTransferenciaAtomica(
    salida: RegistrarMovimientoData,
    entrada: RegistrarMovimientoData,
  ): Promise<[MovimientoCajaEntity, MovimientoCajaEntity]>;
  crearReposicion(data: CrearReposicionData): Promise<ReposicionCajaEntity>;

  crearConsignacion(data: CrearConsignacionData): Promise<ConsignacionEntity>;
  findConsignacionById(id: number): Promise<ConsignacionEntity | null>;
  findConsignacionesBySesion(sesionId: number): Promise<ConsignacionEntity[]>;
  aprobarConsignacion(id: number, data: AprobarConsignacionData): Promise<ConsignacionEntity>;

  crearDiferencia(data: CrearDiferenciaData): Promise<DiferenciaCajaEntity>;
  findDiferenciaById(id: number): Promise<DiferenciaCajaEntity | null>;
  resolverDiferencia(id: number, data: AprobarDiferenciaData): Promise<DiferenciaCajaEntity>;
  findDiferenciasPendientesBySucursal(sucursalId: number): Promise<(DiferenciaCajaEntity & { cajaNombre: string })[]>;
  findDiferenciasBySucursal(sucursalId: number, filters: DiferenciasFiltros): Promise<DiferenciaRegistroItem[]>;

  findReposicionById(id: number): Promise<ReposicionCajaEntity | null>;
  findReposicionByCodigo(codigo: string): Promise<ReposicionCajaEntity | null>;
  confirmarReposicion(id: number, aprobadorId: number): Promise<ReposicionCajaEntity>;
  // RNF-5.02: acreditar el IN y actualizar estado en una única transacción ACID
  confirmarCustodiaAtomica(
    reposicionId: number,
    movimientoEntrada: RegistrarMovimientoData,
    receptorId: number,
  ): Promise<ReposicionCajaEntity>;

  getMovimientos(sesionId: number): Promise<MovimientoCajaEntity[]>;
  getStatusPunto(cajaPadreId: number): Promise<StatusPunto>;
  updateCajeroAsignado(sesionId: number, cajeroId: number | null): Promise<SesionCajaEntity>;
  /** Sin regionalId = todo el comercio. Con regionalId = solo esa regional (supervisor). */
  getConsolidadoPorRegional(regionalId?: number): Promise<{ regionalId: number; porMedio: Record<string, string> }[]>;
  getConsolidadoPorSesion(regionalId?: number): Promise<{
    sesionId: number;
    cajaId: number;
    cajaNombre: string;
    sucursalNombre: string;
    cajeroNombre: string | null;
    cajeroEmail: string | null;
    porMedio: Record<string, string>;
  }[]>;
  getBalancePagos(fechaInicio: Date, fechaFin: Date): Promise<BalancePagosRow[]>;
  getHistoricoMovimientos(filtros: HistoricoFiltros): Promise<{ items: HistoricoMovimientoItem[]; total: number }>;
}
