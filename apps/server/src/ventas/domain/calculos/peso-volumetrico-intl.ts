export interface PesoVolumetricoIntlResult {
  pesoVol: number;
  valido: boolean;
  pesoMaximoProveedor: number | null;
}

export function calcularPesoVolumetricoIntl(
  alto: number,
  ancho: number,
  largo: number,
  factorVolumetrico = 6000,
  pesoMaximoProveedor?: number | null,
): PesoVolumetricoIntlResult {
  const pesoVol = (alto * ancho * largo) / factorVolumetrico;
  const valido =
    pesoMaximoProveedor === null || pesoMaximoProveedor === undefined
      ? true
      : pesoVol <= pesoMaximoProveedor;
  return {
    pesoVol,
    valido,
    pesoMaximoProveedor: pesoMaximoProveedor ?? null,
  };
}
