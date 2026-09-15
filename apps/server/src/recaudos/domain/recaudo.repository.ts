import type { ConvenioEntity, RecaudoEntity } from './recaudo.entity.js';

export const RECAUDOS_REPOSITORY = Symbol('RECAUDOS_REPOSITORY');

export interface RegistrarRecaudoData {
  convenioId:     number;
  sucursalId:     number;
  sesionCajaId:   number;
  usuarioId:      number;
  clienteId?:     number;
  referenciaPago: string;
  codigoBarras?:  string;
  monto:          number;
}

export interface IRecaudosRepository {
  findConveniosBySucursal(sucursalId: number): Promise<ConvenioEntity[]>;
  findConvenioById(id: number): Promise<ConvenioEntity | null>;
  isConvenioActivoEnSucursal(convenioId: number, sucursalId: number): Promise<boolean>;
  registrarRecaudo(data: RegistrarRecaudoData): Promise<RecaudoEntity>;
  anularRecaudo(id: number): Promise<RecaudoEntity>;
  findRecaudoById(id: number): Promise<RecaudoEntity | null>;
  findRecaudosBySesion(sesionId: number): Promise<RecaudoEntity[]>;
}
