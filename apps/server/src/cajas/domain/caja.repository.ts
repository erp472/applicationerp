import type { CajaEntity, CajaPadreEntity } from './caja.entity.js';

export const CAJAS_REPOSITORY = Symbol('CAJAS_REPOSITORY');

export interface ICajasRepository {
  findById(id: number): Promise<CajaEntity | null>;
  findBySucursal(sucursalId: number): Promise<CajaEntity[]>;
  findPadreBySucursal(sucursalId: number): Promise<CajaPadreEntity | null>;
}
