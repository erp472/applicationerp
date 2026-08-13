import type { RegionalEntity } from './regional.entity.js';
import type { QueryRegionalDto } from '../dto/query-regional.dto.js';
import type { SaldoSucursal } from './calculos/consolidado-regional.js';
import type { SucursalActividad } from './calculos/sucursales-activas.js';

export const REGIONALES_REPOSITORY = Symbol('REGIONALES_REPOSITORY');

export interface IRegionalesRepository {
  create(data: { comercioId: number; codigo: string; nombre: string }): Promise<RegionalEntity>;
  findAll(query: QueryRegionalDto): Promise<{ datos: RegionalEntity[]; total: number }>;
  findById(id: number): Promise<RegionalEntity | null>;
  findByCodigo(codigo: string): Promise<RegionalEntity | null>;
  comercioExists(comercioId: number): Promise<boolean>;
  countActiveSucursales(regionalId: number): Promise<number>;
  getSucursalesConActividad(regionalId: number): Promise<SucursalActividad[]>;
  getSaldosPorSucursal(regionalId: number): Promise<SaldoSucursal[]>;
  update(id: number, data: { nombre?: string; activo?: boolean }): Promise<RegionalEntity>;
  softDelete(id: number): Promise<RegionalEntity>;
}
