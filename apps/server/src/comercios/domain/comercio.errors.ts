export abstract class ComercioDomainError extends Error {
  abstract readonly statusCode: number;
}

export class ComercioNotFoundError extends ComercioDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Comercio ${id} not found`);
    this.name = 'ComercioNotFoundError';
  }
}

export class ComercioCodigoDuplicadoError extends ComercioDomainError {
  readonly statusCode = 409;
  constructor(codigo: string) {
    super(`Código de comercio '${codigo}' ya está registrado`);
    this.name = 'ComercioCodigoDuplicadoError';
  }
}

export class ComercioNitDuplicadoError extends ComercioDomainError {
  readonly statusCode = 409;
  constructor(nit: string) {
    super(`NIT '${nit}' ya está registrado`);
    this.name = 'ComercioNitDuplicadoError';
  }
}

export class ComercioConRegionalesActivasError extends ComercioDomainError {
  readonly statusCode = 409;
  constructor(id: string) {
    super(`Comercio ${id} tiene regionales activas y no puede eliminarse`);
    this.name = 'ComercioConRegionalesActivasError';
  }
}

export class ComercioNitFormatoInvalidoError extends ComercioDomainError {
  readonly statusCode = 400;
  constructor(nit: string) {
    super(`NIT '${nit}' tiene formato inválido (esperado: dígitos con guión opcional, ej: 830113400-3)`);
    this.name = 'ComercioNitFormatoInvalidoError';
  }
}
