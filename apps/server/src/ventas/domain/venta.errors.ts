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
