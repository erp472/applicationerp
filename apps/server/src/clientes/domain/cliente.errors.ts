export abstract class ClienteDomainError extends Error {
  abstract readonly statusCode: number;
}

export class ClienteNoEncontradoError extends ClienteDomainError {
  readonly statusCode = 404;
  constructor(id: number | string) {
    super(`Cliente ${id} no encontrado`);
    this.name = 'ClienteNoEncontradoError';
  }
}

export class ClienteYaExisteError extends ClienteDomainError {
  readonly statusCode = 409;
  constructor(tipoDoc: string, numDoc: string) {
    super(`Ya existe un cliente con ${tipoDoc} ${numDoc}`);
    this.name = 'ClienteYaExisteError';
  }
}

export class TipoClienteNoEncontradoError extends ClienteDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Tipo de cliente ${id} no encontrado`);
    this.name = 'TipoClienteNoEncontradoError';
  }
}

export class TipoClienteCodigoDuplicadoError extends ClienteDomainError {
  readonly statusCode = 409;
  constructor(codigo: string) {
    super(`Ya existe un tipo de cliente con el código "${codigo}"`);
    this.name = 'TipoClienteCodigoDuplicadoError';
  }
}
