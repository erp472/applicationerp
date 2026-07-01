export abstract class PermisosDomainError extends Error {
  abstract readonly statusCode: number;
}

export class RolNotFoundError extends PermisosDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Rol ${id} no encontrado`);
    this.name = 'RolNotFoundError';
  }
}

export class PermisoNotFoundError extends PermisosDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Permiso ${id} no encontrado`);
    this.name = 'PermisoNotFoundError';
  }
}

export class RolNombreDuplicadoError extends PermisosDomainError {
  readonly statusCode = 409;
  constructor(nombre: string) {
    super(`Ya existe un rol con el nombre "${nombre}"`);
    this.name = 'RolNombreDuplicadoError';
  }
}

export class PermisoNombreDuplicadoError extends PermisosDomainError {
  readonly statusCode = 409;
  constructor(nombre: string) {
    super(`Ya existe un permiso con el nombre "${nombre}"`);
    this.name = 'PermisoNombreDuplicadoError';
  }
}

export class RolPermisoYaAsignadoError extends PermisosDomainError {
  readonly statusCode = 409;
  constructor(rolId: string, permisoId: string) {
    super(`El permiso ${permisoId} ya está asignado al rol ${rolId}`);
    this.name = 'RolPermisoYaAsignadoError';
  }
}
