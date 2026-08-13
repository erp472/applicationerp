export class DimensionesMáximasExcedenError extends Error {
  readonly statusCode = 422;
  constructor(dimension: string, valor: number, maximo: number) {
    super(`La dimensión ${dimension} (${valor} cm) supera el máximo permitido (${maximo} cm)`);
    this.name = 'DimensionesMáximasExcedenError';
  }
}

export function validarDimensionesMaximas(
  altoCm:      number,
  anchoCm:     number,
  largoCm:     number,
  altoMaxCm:   number | null | undefined,
  anchoMaxCm:  number | null | undefined,
  largoMaxCm:  number | null | undefined,
): void {
  if (altoMaxCm  != null && altoCm  > altoMaxCm)  throw new DimensionesMáximasExcedenError('alto',  altoCm,  altoMaxCm);
  if (anchoMaxCm != null && anchoCm > anchoMaxCm)  throw new DimensionesMáximasExcedenError('ancho', anchoCm, anchoMaxCm);
  if (largoMaxCm != null && largoCm > largoMaxCm)  throw new DimensionesMáximasExcedenError('largo', largoCm, largoMaxCm);
}
