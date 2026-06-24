export abstract class UsuarioDomainError extends Error {
  abstract readonly statusCode: number;
}

export class UsuarioNotFoundError extends UsuarioDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Usuario ${id} no encontrado`);
    this.name = 'UsuarioNotFoundError';
  }
}

export class EmailYaRegistradoError extends UsuarioDomainError {
  readonly statusCode = 409;
  constructor(email: string) {
    super(`El email ${email} ya está registrado`);
    this.name = 'EmailYaRegistradoError';
  }
}

export class SucursalNoEncontradaError extends UsuarioDomainError {
  readonly statusCode = 400;
  constructor(id: string) {
    super(`Sucursal ${id} no encontrada`);
    this.name = 'SucursalNoEncontradaError';
  }
}
