import type { SucursalEntity } from './sucursal.entity.js';
import type { QuerySucursalDto } from '../dto/query-sucursal.dto.js';

export const SUCURSALES_REPOSITORY = Symbol('SUCURSALES_REPOSITORY');

export interface ISucursalesRepository {
  create(data: {
    regionalId: number; codigo: string; nombre: string; tipo: string;
    direccion?: string | null; telefono?: string | null; email?: string | null;
    horarioApertura?: Date | null; horarioCierre?: Date | null;
    paisId?: number | null; departamentoId?: number | null; ciudadId?: number | null;
  }): Promise<SucursalEntity>;
  findAll(query: QuerySucursalDto): Promise<{ datos: SucursalEntity[]; total: number }>;
  findById(id: number): Promise<SucursalEntity | null>;
  findByCodigo(codigo: string): Promise<SucursalEntity | null>;
  regionalExists(regionalId: number): Promise<boolean>;
  ciudadDepartamentoId(ciudadId: number): Promise<number | null>;
  countActiveUsers(sucursalId: number): Promise<number>;
  update(id: number, data: {
    regionalId?: number; nombre?: string; tipo?: string; direccion?: string | null;
    telefono?: string | null; email?: string | null;
    horarioApertura?: Date | null; horarioCierre?: Date | null;
    paisId?: number | null; departamentoId?: number | null; ciudadId?: number | null;
    activo?: boolean;
  }): Promise<SucursalEntity>;
  softDelete(id: number): Promise<SucursalEntity>;
}
