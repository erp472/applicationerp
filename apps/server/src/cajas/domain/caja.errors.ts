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

// BR-CAJ-010: el punto no puede custodiar más efectivo del que la Caja General le asignó
export class AperturaExcedeAsignacionPuntoError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(montoApertura: string, baseGeneral: string, punto: string) {
    super(
      `La apertura de $${montoApertura} supera la base asignada al punto ${punto} ($${baseGeneral}). ` +
      `El excedente pertenece a la Caja General y no puede custodiarlo el punto.`,
    );
    this.name = 'AperturaExcedeAsignacionPuntoError';
  }
}

// BR-CAJ-009: la base de una auxiliar no puede exceder su fondo configurado
export class BaseExcedeLimiteCajaError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(baseAsignada: string, baseDia: string, codigo: string) {
    super(
      `La base asignada $${baseAsignada} supera el fondo configurado de la caja ${codigo} ($${baseDia}). ` +
      `El excedente pertenece a la Caja Fuerte del punto.`,
    );
    this.name = 'BaseExcedeLimiteCajaError';
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

// La Caja Fuerte y la Caja Menor son bolsillos de la caja principal: las custodia el
// supervisor del punto y no admiten un cajero propio.
export class CajaNoAsignableError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(codigo: string, tipo: string) {
    super(
      `La caja ${codigo} es de tipo ${tipo}: forma parte de la caja principal del punto y no admite ` +
      `un cajero asignado. Solo las cajas que venden o prestan servicios reciben cajero.`,
    );
    this.name = 'CajaNoAsignableError';
  }
}

// Una caja operativa sin cajero deja la sesión sin dueño, y sin dueño cualquier cajero
// puede vender en ella: la venta deja de ser trazable al cajero y a su supervisor.
export class CajaSinCajeroError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(codigo: string) {
    super(
      `La caja ${codigo} no tiene cajero asignado. Asigne un cajero fijo desde la gestión del ` +
      `punto o indique uno en la apertura antes de abrirla.`,
    );
    this.name = 'CajaSinCajeroError';
  }
}

// El responsable de un punto o de una caja tiene que tener el rol que corresponde y estar
// destacado en esa sucursal; si no, se rompe la segregación de funciones (RF-1.03).
export class UsuarioNoAsignableError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'UsuarioNoAsignableError';
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

// BR-CAJ-011: la suma de bases abiertas en el punto no puede superar la base general configurada
export class BasePuntoInsuficienteError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(totalAsignado: string, baseGeneral: string) {
    super(
      `Las bases ya abiertas ($${totalAsignado}) superan la base asignada al punto ($${baseGeneral}). ` +
      `Cierre una caja auxiliar antes de abrir esta.`,
    );
    this.name = 'BasePuntoInsuficienteError';
  }
}

// Configuración: no se guarda un punto que el motor de apertura va a rechazar después
export class ConfiguracionPuntoInvalidaError extends CajaDomainError {
  readonly statusCode = 422;
  constructor(detalle: string) {
    super(detalle);
    this.name = 'ConfiguracionPuntoInvalidaError';
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
