import type { ServicioEntity, ServicioSucursalEntity } from './servicio.entity.js';
import type { QueryServicioDto } from '../dto/query-servicio.dto.js';

export const SERVICIOS_REPOSITORY = Symbol('SERVICIOS_REPOSITORY');

export interface IServiciosRepository {
  create(data: {
    codigo: string; nombre: string; descripcion?: string | null;
    tipo: string; requiereEstampilla: boolean; requiereDimensiones: boolean;
    requiereValorDeclarado: boolean; pesoMaximoKg?: number | null;
    factorVolumetrico: number; tiempoEntregaDias?: number | null;
    codigoSigma?: string | null;
  }): Promise<ServicioEntity>;

  findAll(query: QueryServicioDto): Promise<{ datos: ServicioEntity[]; total: number }>;

  findById(id: number): Promise<ServicioEntity | null>;

  codigoExists(codigo: string): Promise<boolean>;

  update(id: number, data: {
    nombre?: string; descripcion?: string | null; requiereEstampilla?: boolean;
    requiereDimensiones?: boolean; requiereValorDeclarado?: boolean;
    pesoMaximoKg?: number | null; factorVolumetrico?: number;
    tiempoEntregaDias?: number | null; codigoSigma?: string | null;
    activo?: boolean;
  }): Promise<ServicioEntity>;

  softDelete(id: number): Promise<ServicioEntity>;

  assignSucursal(servicioId: number, sucursalId: number): Promise<ServicioSucursalEntity>;

  unassignSucursal(servicioId: number, sucursalId: number): Promise<void>;

  findSucursalesByServicio(servicioId: number): Promise<ServicioSucursalEntity[]>;

  sucursalExists(sucursalId: number): Promise<boolean>;

  isAssigned(servicioId: number, sucursalId: number): Promise<boolean>;
}
