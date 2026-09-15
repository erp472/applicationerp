export abstract class EnvioMasivoDomainError extends Error {
  abstract readonly statusCode: number;
}

export class LoteNoEncontradoError extends EnvioMasivoDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Lote masivo ${id} no encontrado`);
    this.name = 'LoteNoEncontradoError';
  }
}

export class LoteNoEnBorradorError extends EnvioMasivoDomainError {
  readonly statusCode = 409;
  constructor(id: number) {
    super(`Lote masivo ${id} no está en estado borrador`);
    this.name = 'LoteNoEnBorradorError';
  }
}

export class ItemNoEncontradoError extends EnvioMasivoDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Item masivo ${id} no encontrado`);
    this.name = 'ItemNoEncontradoError';
  }
}

export class LoteSinItemsError extends EnvioMasivoDomainError {
  readonly statusCode = 422;
  constructor() {
    super('El lote no tiene items para confirmar');
    this.name = 'LoteSinItemsError';
  }
}
