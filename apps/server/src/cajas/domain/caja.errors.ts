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
    super(`No se puede cerrar la sesión principal: hay ${cantidad} caja(s) auxiliar(es) con sesión abierta`);
    this.name = 'AuxiliaresAbiertasError';
  }
}

export class MontoInvalidoError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(label: string) {
    super(`El monto de ${label} debe ser mayor a cero`);
    this.name = 'MontoInvalidoError';
  }
}

export class CajeroYaAsignadoError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(cajeroId: number) {
    super(`El cajero ${cajeroId} ya es custodio responsable de otra caja abierta`);
    this.name = 'CajeroYaAsignadoError';
  }
}

export class DiferenciaNoEncontradaError extends CajaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Diferencia de caja ${id} no encontrada`);
    this.name = 'DiferenciaNoEncontradaError';
  }
}

export class DiferenciaEstadoInvalidoError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(estado: string) {
    super(`La diferencia ya fue procesada con estado: ${estado}`);
    this.name = 'DiferenciaEstadoInvalidoError';
  }
}

// RF-1.03: el aprobador de una diferencia no puede ser el custodio responsable de ella
export class SoDViolacionError extends CajaDomainError {
  readonly statusCode = 403;
  constructor() {
    super('RF-1.03: el aprobador no puede ser el mismo custodio responsable de la diferencia');
    this.name = 'SoDViolacionError';
  }
}

export class ReposicionNoEncontradaError extends CajaDomainError {
  readonly statusCode = 404;
  constructor(ref: string | number) {
    super(`Reposición de caja ${ref} no encontrada`);
    this.name = 'ReposicionNoEncontradaError';
  }
}

export class ReposicionEstadoInvalidoError extends CajaDomainError {
  readonly statusCode = 409;
  constructor(estado: string) {
    super(`La reposición ya fue procesada con estado: ${estado}`);
    this.name = 'ReposicionEstadoInvalidoError';
  }
}

// RF-4.01: monto confirmado difiere del emitido — se abre incidente de conciliación
export class DiscrepanciaTransitoError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(emitido: string, recibido: string) {
    super(
      `Discrepancia en tránsito: emitido $${emitido}, recibido $${recibido}. Se requiere intervención del supervisor.`,
    );
    this.name = 'DiscrepanciaTransitoError';
  }
}

// RF-2.02: bloqueo operativo cuando saldo >= tope_max (remesa obligatoria)
export class TopeMaximoEfectivoError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(saldo: string, tope: string) {
    super(
      `Caja bloqueada para ingresos de efectivo: saldo $${saldo} alcanzó el tope máximo $${tope}. Realice un traslado a bóveda (RF-2.02) antes de continuar.`,
    );
    this.name = 'TopeMaximoEfectivoError';
  }
}
