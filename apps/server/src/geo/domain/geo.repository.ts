import type { PaisEntity, DepartamentoEntity, CiudadEntity } from './geo.entity.js';

export const GEO_REPOSITORY = 'GEO_REPOSITORY';

export interface IGeoRepository {
  findAllPaises(): Promise<PaisEntity[]>;
  findDepartamentosByPais(paisId: number): Promise<DepartamentoEntity[]>;
  findCiudadesByDepartamento(departamentoId: number): Promise<CiudadEntity[]>;
}
