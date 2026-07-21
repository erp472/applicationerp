import type { TipoClienteEntity } from './cliente.entity.js';

export interface CreateTipoClienteData {
  codigo: string;
  nombre: string;
  descuentoPorcentaje?: string;
  aplicaEstampillas?: boolean;
  aplicaGirosSisben?: boolean;
  vigenciaInicio?: Date | null;
  vigenciaFin?: Date | null;
}

export interface UpdateTipoClienteData {
  nombre?: string;
  descuentoPorcentaje?: string;
  aplicaEstampillas?: boolean;
  aplicaGirosSisben?: boolean;
  activo?: boolean;
  vigenciaInicio?: Date | null;
  vigenciaFin?: Date | null;
}

export interface ITipoClienteRepository {
  findAll(soloActivos?: boolean): Promise<TipoClienteEntity[]>;
  findById(id: number): Promise<TipoClienteEntity | null>;
  findByCodigo(codigo: string): Promise<TipoClienteEntity | null>;
  create(data: CreateTipoClienteData): Promise<TipoClienteEntity>;
  update(id: number, data: UpdateTipoClienteData): Promise<TipoClienteEntity>;
  softDelete(id: number): Promise<void>;
}

export const TIPO_CLIENTE_REPOSITORY = Symbol('ITipoClienteRepository');
