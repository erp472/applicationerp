export class SacaNoEncontradaError extends Error {
  constructor(id: number) { super(`Saca #${id} no encontrada`); this.name = 'SacaNoEncontrada'; }
}

export class SacaCerradaError extends Error {
  constructor(id: number) { super(`Saca #${id} ya está cerrada`); this.name = 'SacaCerrada'; }
}

export class EnvioYaEnSacaError extends Error {
  constructor(envioId: number) { super(`Envío #${envioId} ya pertenece a una saca`); this.name = 'EnvioYaEnSaca'; }
}

export class EnvioNoEncontradoSacaError extends Error {
  constructor(envioId: number) { super(`Envío #${envioId} no encontrado`); this.name = 'EnvioNoEncontrado'; }
}
