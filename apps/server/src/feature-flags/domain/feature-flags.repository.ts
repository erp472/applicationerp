import type { FeatureFlagEntity } from './feature-flag.entity.js';

export const FEATURE_FLAGS_REPOSITORY = Symbol('FEATURE_FLAGS_REPOSITORY');

export interface CreateFeatureFlagData {
  codigo: string;
  descripcion?: string;
  activo: boolean;
  entorno: string;
}

export interface UpdateFeatureFlagData {
  descripcion?: string;
  activo?: boolean;
  entorno?: string;
}

export interface IFeatureFlagsRepository {
  findAll(entorno?: string): Promise<FeatureFlagEntity[]>;
  findById(id: number): Promise<FeatureFlagEntity | null>;
  findByCodigo(codigo: string): Promise<FeatureFlagEntity | null>;
  findActivos(entorno: string): Promise<FeatureFlagEntity[]>;
  create(data: CreateFeatureFlagData): Promise<FeatureFlagEntity>;
  update(id: number, data: UpdateFeatureFlagData): Promise<FeatureFlagEntity>;
  remove(id: number): Promise<void>;
  asignarRol(featureFlagId: number, rolId: number): Promise<void>;
  revocarRol(featureFlagId: number, rolId: number): Promise<void>;
  asignarUsuario(featureFlagId: number, usuarioId: number): Promise<void>;
  revocarUsuario(featureFlagId: number, usuarioId: number): Promise<void>;
}
