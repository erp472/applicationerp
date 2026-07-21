import type { ClienteEntity, TipoDocumento } from './cliente.entity.js';

export interface CreateClienteData {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  tipoClienteId?: number | null;
  nivelSisben?: number | null;
}

export interface UpdateClienteData {
  nombre?: string;
  apellido?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  codigoPostal?: string | null;
  tipoClienteId?: number | null;
  nivelSisben?: number | null;
  activo?: boolean;
}

export interface SearchClienteParams {
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  nombre?: string;
  tipoClienteId?: number;
  limit?: number;
  offset?: number;
}

export interface IClienteRepository {
  findById(id: number): Promise<ClienteEntity | null>;
  findByDocumento(tipo: TipoDocumento, numero: string): Promise<ClienteEntity | null>;
  search(params: SearchClienteParams): Promise<{ items: ClienteEntity[]; total: number }>;
  create(data: CreateClienteData): Promise<ClienteEntity>;
  update(id: number, data: UpdateClienteData): Promise<ClienteEntity>;
}

export const CLIENTE_REPOSITORY = Symbol('IClienteRepository');
