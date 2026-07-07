export abstract class EquipoDomainError extends Error {
  abstract readonly statusCode: number;
}

export class EquipoNotFoundError extends EquipoDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Equipo ${id} not found`);
    this.name = 'EquipoNotFoundError';
  }
}

export class EquipoMacFormatoInvalidoError extends EquipoDomainError {
  readonly statusCode = 400;
  constructor(mac: string) {
    super(`MAC address '${mac}' tiene formato inválido (esperado: XX:XX:XX:XX:XX:XX)`);
    this.name = 'EquipoMacFormatoInvalidoError';
  }
}

export class EquipoMacDuplicadoError extends EquipoDomainError {
  readonly statusCode = 409;
  constructor(mac: string) {
    super(`MAC address '${mac}' ya está registrado`);
    this.name = 'EquipoMacDuplicadoError';
  }
}

export class EquipoSucursalNoEncontradaError extends EquipoDomainError {
  readonly statusCode = 400;
  constructor(id: string) {
    super(`Sucursal ${id} no encontrada`);
    this.name = 'EquipoSucursalNoEncontradaError';
  }
}

// BR-EQP-005: usado por el MAC guard (#POC-AUTH-001), no por el CRUD
export class EquipoInactivoError extends EquipoDomainError {
  readonly statusCode = 403;
  constructor(mac: string) {
    super(`Equipo con MAC '${mac}' está inactivo y no puede autenticar`);
    this.name = 'EquipoInactivoError';
  }
}
