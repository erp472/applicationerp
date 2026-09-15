import type { SacaEntity, TipoSaca, TipoConsolidacionSaca } from './saca.entity.js';

export const SACAS_REPOSITORY = Symbol('SACAS_REPOSITORY');

export interface CreateSacaData {
  numeroPrecinto:      string;
  sucursalId:          number;
  sesionCajaId?:       number;
  usuarioId:           number;
  tipo:                TipoSaca;
  tipoConsolidacion?:  TipoConsolidacionSaca;
  centroOperativoDest?: string;
  transportistaNombre?: string;
}

export interface ISacasRepository {
  create(data: CreateSacaData): Promise<SacaEntity>;
  findById(id: number): Promise<SacaEntity | null>;
  findBySucursal(sucursalId: number, estado?: string): Promise<SacaEntity[]>;
  addEnvio(sacaId: number, envioId: number): Promise<void>;
  envioEnSaca(envioId: number): Promise<boolean>;
  cerrar(id: number, pesoKg?: number, transportistaNombre?: string, fechaDespacho?: Date): Promise<SacaEntity>;
}
