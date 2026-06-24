export const SUCURSALES_REPOSITORY = Symbol('SUCURSALES_REPOSITORY');

export interface ISucursalesRepository {
  existsById(id: string): Promise<boolean>;
}
