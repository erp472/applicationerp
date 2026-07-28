export abstract class VentaDomainError extends Error {
  abstract readonly statusCode: number;
}

export class VentaNoEncontradaError extends VentaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Venta ${id} no encontrada`);
    this.name = 'VentaNoEncontradaError';
  }
}

export class ClienteNoEncontradoError extends VentaDomainError {
  readonly statusCode = 404;
  constructor(tipo: string, numero: string) {
    super(`No se encontró cliente con documento ${tipo} ${numero}`);
    this.name = 'ClienteNoEncontradoError';
  }
}

export class ProductoNoEncontradoError extends VentaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Producto ${id} no encontrado o inactivo`);
    this.name = 'ProductoNoEncontradoError';
  }
}

export class DetalleNoEncontradoError extends VentaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Ítem de carrito ${id} no encontrado`);
    this.name = 'DetalleNoEncontradoError';
  }
}

export class SesionCajaInactivaError extends VentaDomainError {
  readonly statusCode = 409;
  constructor(cajaId: number) {
    super(`La caja ${cajaId} no tiene sesión activa`);
    this.name = 'SesionCajaInactivaError';
  }
}

export class CarritoVacioError extends VentaDomainError {
  readonly statusCode = 422;
  constructor() {
    super('No se puede confirmar: el carrito está vacío');
    this.name = 'CarritoVacioError';
  }
}

export class VentaYaAnuladaError extends VentaDomainError {
  readonly statusCode = 409;
  constructor(id: number) {
    super(`La venta ${id} ya está anulada`);
    this.name = 'VentaYaAnuladaError';
  }
}

export class VentaDeOtroTurnoError extends VentaDomainError {
  readonly statusCode = 403;
  constructor(id: number) {
    super(`La venta ${id} no pertenece al turno activo de esta caja`);
    this.name = 'VentaDeOtroTurnoError';
  }
}

export class ApartadoNoDisponibleError extends VentaDomainError {
  readonly statusCode = 409;
  constructor(numero: string) {
    super(`El apartado postal ${numero} no está disponible`);
    this.name = 'ApartadoNoDisponibleError';
  }
}

export class ApartadoNoEncontradoError extends VentaDomainError {
  readonly statusCode = 404;
  constructor(numero: string) {
    super(`Apartado postal ${numero} no encontrado en esta sucursal`);
    this.name = 'ApartadoNoEncontradoError';
  }
}

export class ServicioNoEncontradoError extends VentaDomainError {
  readonly statusCode = 404;
  constructor(id: number) {
    super(`Servicio postal ${id} no encontrado o inactivo`);
    this.name = 'ServicioNoEncontradoError';
  }
}

export class TarifaNoEncontradaError extends VentaDomainError {
  readonly statusCode = 422;
  constructor(servicioId: number, pesoKg: number) {
    super(`Sin tarifa para el servicio ${servicioId} con peso ${pesoKg} kg`);
    this.name = 'TarifaNoEncontradaError';
  }
}

export class StockInsuficienteError extends VentaDomainError {
  readonly statusCode = 409;
  constructor(nombre: string, disponible: number, solicitado: number) {
    super(`Stock insuficiente para "${nombre}": disponible ${disponible}, solicitado ${solicitado}`);
    this.name = 'StockInsuficienteError';
  }
}

export class CantidadMinimaError extends VentaDomainError {
  readonly statusCode = 422;
  constructor(nombre: string, minimo: number) {
    super(`La cantidad mínima de compra para "${nombre}" es ${minimo} unidades`);
    this.name = 'CantidadMinimaError';
  }
}

export class CantidadMaximaError extends VentaDomainError {
  readonly statusCode = 422;
  constructor(nombre: string, maximo: number) {
    super(`La cantidad máxima de compra para "${nombre}" es ${maximo} unidades`);
    this.name = 'CantidadMaximaError';
  }
}

export class CantidadFueraDeTarifaError extends VentaDomainError {
  readonly statusCode = 422;
  constructor(nombre: string, cantidad: number) {
    super(`La cantidad ${cantidad} no corresponde a ningún tramo de tarifa para "${nombre}"`);
    this.name = 'CantidadFueraDeTarifaError';
  }
}

export class PesoExcedeLimiteError extends VentaDomainError {
  readonly statusCode = 422;
  constructor(pesoKg: number, limiteKg: number) {
    super(`El peso ${pesoKg} kg supera el límite del servicio (${limiteKg} kg)`);
    this.name = 'PesoExcedeLimiteError';
  }
}

export class EfectivoInsuficienteError extends VentaDomainError {
  readonly statusCode = 422;
  constructor(recibido: number, total: number) {
    super(`Efectivo insuficiente: recibido $${recibido.toLocaleString('es-CO')}, total a pagar $${total.toLocaleString('es-CO')}`);
    this.name = 'EfectivoInsuficienteError';
  }
}
