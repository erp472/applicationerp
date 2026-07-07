import type { ComercioEntity } from './comercio.entity.js';
import type { QueryComercioDto } from '../dto/query-comercio.dto.js';

export const COMERCIOS_REPOSITORY = Symbol('COMERCIOS_REPOSITORY');

export interface IComerciosRepository {
  create(data: { codigo: string; nombre: string; nit: string }): Promise<ComercioEntity>;
  findAll(query: QueryComercioDto): Promise<{ datos: ComercioEntity[]; total: number }>;
  findById(id: number): Promise<ComercioEntity | null>;
  findByCodigo(codigo: string): Promise<ComercioEntity | null>;
  findByNit(nit: string): Promise<ComercioEntity | null>;
  findByNitExcluding(nit: string, excludeId: number): Promise<ComercioEntity | null>;
  countActiveRegionales(comercioId: number): Promise<number>;
  update(id: number, data: { nombre?: string; nit?: string; activo?: boolean }): Promise<ComercioEntity>;
  softDelete(id: number): Promise<ComercioEntity>;
}
