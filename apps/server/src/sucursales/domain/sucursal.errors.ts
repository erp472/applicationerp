export abstract class SucursalDomainError extends Error {
  abstract readonly statusCode: number;
}

export class SucursalNotFoundError extends SucursalDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Sucursal ${id} not found`);
    this.name = 'SucursalNotFoundError';
  }
}

export class SucursalCodigoDuplicadoError extends SucursalDomainError {
  readonly statusCode = 409;
  constructor(codigo: string) {
    super(`Código de sucursal '${codigo}' ya está registrado`);
    this.name = 'SucursalCodigoDuplicadoError';
  }
}

export class SucursalRegionalNoEncontradaError extends SucursalDomainError {
  readonly statusCode = 400;
  constructor(id: string) {
    super(`Regional ${id} no encontrada`);
    this.name = 'SucursalRegionalNoEncontradaError';
  }
}

export class SucursalHorarioInvalidoError extends SucursalDomainError {
  readonly statusCode = 400;
  constructor() {
    super('El horario de cierre debe ser posterior al de apertura');
    this.name = 'SucursalHorarioInvalidoError';
  }
}

export class SucursalConUsuariosActivosError extends SucursalDomainError {
  readonly statusCode = 409;
  constructor(id: string) {
    super(`Sucursal ${id} tiene usuarios activos asignados`);
    this.name = 'SucursalConUsuariosActivosError';
  }
}

export class SucursalEmailInvalidoError extends SucursalDomainError {
  readonly statusCode = 400;
  constructor(email: string) {
    super(`Email '${email}' tiene formato inválido`);
    this.name = 'SucursalEmailInvalidoError';
  }
}

export class SucursalCiudadDepartamentoMismatchError extends SucursalDomainError {
  readonly statusCode = 400;
  constructor(ciudadId: string, departamentoId: string) {
    super(`Ciudad ${ciudadId} no pertenece al departamento ${departamentoId}`);
    this.name = 'SucursalCiudadDepartamentoMismatchError';
  }
}
