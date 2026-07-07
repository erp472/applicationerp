import type { EquipoEntity } from './equipo.entity.js';
import type { QueryEquipoDto } from '../dto/query-equipo.dto.js';

export const EQUIPOS_REPOSITORY = Symbol('EQUIPOS_REPOSITORY');

export interface IEquiposRepository {
  create(data: {
    sucursalId: number; mac: string; nombre?: string | null;
    sistemaOperativo?: string | null;
  }): Promise<EquipoEntity>;
  findAll(query: QueryEquipoDto): Promise<{ datos: EquipoEntity[]; total: number }>;
  findById(id: number): Promise<EquipoEntity | null>;
  findByMac(mac: string): Promise<EquipoEntity | null>;
  macExists(mac: string): Promise<boolean>;
  sucursalExists(sucursalId: number): Promise<boolean>;
  update(id: number, data: {
    nombre?: string | null; sistemaOperativo?: string | null; activo?: boolean;
  }): Promise<EquipoEntity>;
  softDelete(id: number): Promise<EquipoEntity>;
}
