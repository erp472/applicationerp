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

export class CajaPadreNoEncontradaError extends CajaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Caja padre ${id} no encontrada`);
    this.name = 'CajaPadreNoEncontradaError';
  }
}

export class CodigoCajaDuplicadoError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(codigo: string) {
    super(`Ya existe una caja con el código ${codigo} en esta sucursal`);
    this.name = 'CodigoCajaDuplicadoError';
  }
}

export class AuxiliaresAbiertasError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(cantidad: number) {
    super(`No se puede cerrar el turno principal: hay ${cantidad} caja(s) auxiliar(es) con sesión abierta`);
    this.name = 'AuxiliaresAbiertasError';
  }
}
