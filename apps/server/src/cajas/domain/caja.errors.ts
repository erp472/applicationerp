export abstract class CajaDomainError extends Error {
  abstract readonly statusCode: number;
}

export class CajaNoEncontradaError extends CajaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Caja ${id} no encontrada`);
    this.name = 'CajaNoEncontradaError';
  }
}

export class SesionNoEncontradaError extends CajaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Sesión de caja ${id} no encontrada`);
    this.name = 'SesionNoEncontradaError';
  }
}

export class ConsignacionNoEncontradaError extends CajaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Consignación ${id} no encontrada`);
    this.name = 'ConsignacionNoEncontradaError';
  }
}

export class CajaYaAbiertaError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(cajaId: number) {
    super(`La caja ${cajaId} ya tiene una sesión abierta`);
    this.name = 'CajaYaAbiertaError';
  }
}

export class SesionYaCerradaError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(sesionId: number) {
    super(`La sesión ${sesionId} ya está cerrada`);
    this.name = 'SesionYaCerradaError';
  }
}

export class SaldoInsuficienteError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(saldo: string, monto: string) {
    super(`Saldo insuficiente: disponible $${saldo}, requerido $${monto}`);
    this.name = 'SaldoInsuficienteError';
  }
}

export class BaseMinimaVioladaError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(resultante: string, baseMinima: string) {
    super(`La operación dejaría la Caja General en $${resultante}, por debajo del mínimo de $${baseMinima}`);
    this.name = 'BaseMinimaVioladaError';
  }
}

export class ConsignacionEstadoInvalidoError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(estado: string) {
    super(`La consignación ya fue procesada con estado: ${estado}`);
    this.name = 'ConsignacionEstadoInvalidoError';
  }
}
