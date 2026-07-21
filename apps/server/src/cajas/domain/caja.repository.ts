import type { CajaEntity, CajaPadreEntity, SucursalPanelItem } from './caja.entity.js';

export const CAJAS_REPOSITORY = Symbol('CAJAS_REPOSITORY');

export interface CreateCajaData {
  sucursalId:   number;
  cajaPadreId?: number;
  codigo:       string;
  nombre:       string;
  tipo:         'menor' | 'general' | 'pos' | 'pagos';
  baseDia?:     string;
  limiteAlerta?: string;
}

export interface UpdateCajaData {
  cajaPadreId?:  number;
  codigo?:       string;
  nombre?:       string;
  tipo?:         'menor' | 'general' | 'pos' | 'pagos';
  baseDia?:      string;
  limiteAlerta?: string | null;
  activo?:       boolean;
}

export interface CreateCajaPadreData {
  sucursalId:  number;
  nombre:      string;
  baseGeneral?: string;
  horaReset?:  string; // HH:MM
}

export interface UpdateCajaPadreData {
  nombre?:      string;
  baseGeneral?: string;
  horaReset?:   string; // HH:MM
}

export interface ICajasRepository {
  // Caja (auxiliar)
  findById(id: number): Promise<CajaEntity | null>;
  findCajaGeneralByPadre(cajaPadreId: number): Promise<CajaEntity | null>;
  findBySucursal(sucursalId: number): Promise<CajaEntity[]>;
  createCaja(data: CreateCajaData): Promise<CajaEntity>;
  updateCaja(id: number, data: UpdateCajaData): Promise<CajaEntity>;
  deleteCaja(id: number): Promise<void>;

  // CajaPadre (principal)
  findAllPadres(): Promise<CajaPadreEntity[]>;
  findPadreById(id: number): Promise<CajaPadreEntity | null>;
  findPadreBySucursal(sucursalId: number): Promise<CajaPadreEntity | null>;
  createPadre(data: CreateCajaPadreData): Promise<CajaPadreEntity>;
  updatePadre(id: number, data: UpdateCajaPadreData): Promise<CajaPadreEntity>;
  deletePadre(id: number): Promise<void>;

  // Panel admin (sucursales + cajas POS + servicios)
  findPanelAdmin(): Promise<SucursalPanelItem[]>;
  toggleServicioSucursal(sucursalId: number, servicioId: number, activo: boolean): Promise<void>;
}
