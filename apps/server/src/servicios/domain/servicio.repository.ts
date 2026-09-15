import type { ServicioEntity, ServicioSucursalEntity, TarifaEnvioEntity } from './servicio.entity.js';
import type { QueryServicioDto } from '../dto/query-servicio.dto.js';

export const SERVICIOS_REPOSITORY = Symbol('SERVICIOS_REPOSITORY');

export interface CreateTarifaData {
  paisDestino:        string;
  ciudadDestino?:     string | null;
  pesoMinKg:          number;
  pesoMaxKg?:         number | null;
  tarifa:             number;
  tarifaKgAdicional?: number | null;
}

export interface UpdateTarifaData {
  tarifa?:            number;
  tarifaKgAdicional?: number | null;
  activa?:            boolean;
}

export interface IServiciosRepository {
  create(data: {
    codigo: string; nombre: string; descripcion?: string | null;
    tipo: string; requiereEstampilla: boolean; requiereDimensiones: boolean;
    requiereValorDeclarado: boolean; pesoMaximoKg?: number | null;
    factorVolumetrico: number; tiempoEntregaDias?: number | null;
    codigoSigma?: string | null;
    minimoSeguroPostal?: number | null;
    altoMaxCm?: number | null; anchoMaxCm?: number | null; largoMaxCm?: number | null;
  }): Promise<ServicioEntity>;

  findAll(query: QueryServicioDto): Promise<{ datos: ServicioEntity[]; total: number }>;

  findById(id: number): Promise<ServicioEntity | null>;

  codigoExists(codigo: string): Promise<boolean>;

  update(id: number, data: {
    nombre?: string; descripcion?: string | null; requiereEstampilla?: boolean;
    requiereDimensiones?: boolean; requiereValorDeclarado?: boolean;
    pesoMaximoKg?: number | null; factorVolumetrico?: number;
    tiempoEntregaDias?: number | null; codigoSigma?: string | null;
    minimoSeguroPostal?: number | null;
    altoMaxCm?: number | null; anchoMaxCm?: number | null; largoMaxCm?: number | null;
    activo?: boolean;
  }): Promise<ServicioEntity>;

  softDelete(id: number): Promise<ServicioEntity>;

  assignSucursal(servicioId: number, sucursalId: number): Promise<ServicioSucursalEntity>;

  unassignSucursal(servicioId: number, sucursalId: number): Promise<void>;

  findSucursalesByServicio(servicioId: number): Promise<ServicioSucursalEntity[]>;

  sucursalExists(sucursalId: number): Promise<boolean>;

  isAssigned(servicioId: number, sucursalId: number): Promise<boolean>;

  findTarifasByServicio(servicioId: number): Promise<TarifaEnvioEntity[]>;

  createTarifa(servicioId: number, data: CreateTarifaData): Promise<TarifaEnvioEntity>;

  updateTarifa(tarifaId: number, data: UpdateTarifaData): Promise<TarifaEnvioEntity>;

  deleteTarifa(tarifaId: number): Promise<void>;

  updateCertificacion(servicioId: number, tarifa: number | null): Promise<ServicioEntity>;
}
