export abstract class RegionalDomainError extends Error {
  abstract readonly statusCode: number;
}

export class RegionalNotFoundError extends RegionalDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Regional ${id} not found`);
    this.name = 'RegionalNotFoundError';
  }
}

export class RegionalCodigoDuplicadoError extends RegionalDomainError {
  readonly statusCode = 409;
  constructor(codigo: string) {
    super(`Código de regional '${codigo}' ya está registrado`);
    this.name = 'RegionalCodigoDuplicadoError';
  }
}

export class RegionalComercioNoEncontradoError extends RegionalDomainError {
  readonly statusCode = 400;
  constructor(id: string) {
    super(`Comercio ${id} no encontrado`);
    this.name = 'RegionalComercioNoEncontradoError';
  }
}

export class RegionalConSucursalesActivasError extends RegionalDomainError {
  readonly statusCode = 409;
  constructor(id: string) {
    super(`Regional ${id} tiene sucursales activas y no puede modificarse`);
    this.name = 'RegionalConSucursalesActivasError';
  }
}
