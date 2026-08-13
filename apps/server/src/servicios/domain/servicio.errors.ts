export class ServicioDomainError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ServicioNotFoundError extends ServicioDomainError {
  constructor(id: number) {
    super(`Servicio con id '${id}' no encontrado`, 404);
  }
}

export class ServicioCodigoDuplicadoError extends ServicioDomainError {
  constructor(codigo: string) {
    super(`Código de servicio '${codigo}' ya está registrado`, 409);
  }
}

export class ServicioFactorVolumetricoRequeridoError extends ServicioDomainError {
  constructor() {
    super('Se requiere factor_volumetrico cuando requiere_dimensiones es true', 400);
  }
}

export class ServicioPesoExcedidoError extends ServicioDomainError {
  constructor(pesoTarificado: number, pesoMaximo: number) {
    super(`Peso tarificado ${pesoTarificado} kg supera el máximo permitido ${pesoMaximo} kg`, 400);
  }
}

export class ServicioCampoNegativoError extends ServicioDomainError {
  constructor(campo: string) {
    super(`El campo '${campo}' debe ser mayor a cero`, 400);
  }
}

export class ServicioEstampillaInconsistenteError extends ServicioDomainError {
  constructor() {
    super('requiere_estampilla solo aplica a servicios de tipo nacional (#POC-ENV-004)', 400);
  }
}

export class ServicioSucursalNoEncontradaError extends ServicioDomainError {
  constructor(sucursalId: number) {
    super(`Sucursal con id '${sucursalId}' no encontrada`, 400);
  }
}

export class ServicioYaAsignadoError extends ServicioDomainError {
  constructor(servicioId: number, sucursalId: number) {
    super(`Servicio '${servicioId}' ya está asignado a la sucursal '${sucursalId}'`, 409);
  }
}

export class ServicioNoAsignadoError extends ServicioDomainError {
  constructor(servicioId: number, sucursalId: number) {
    super(`Servicio '${servicioId}' no está asignado a la sucursal '${sucursalId}'`, 404);
  }
}

export class ServicioTarifaNotFoundError extends ServicioDomainError {
  constructor(tarifaId: number) {
    super(`Tarifa con id '${tarifaId}' no encontrada para este servicio`, 404);
  }
}
