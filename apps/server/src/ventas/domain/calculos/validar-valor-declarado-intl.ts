const MAXIMO_DEFAULT = '15000000';

export function validarValorDeclaradoIntl(
  valorDeclaradoCop: string,
  maximoCop = MAXIMO_DEFAULT,
): void {
  const declarado = Number(valorDeclaradoCop);
  if (declarado <= 0) throw new Error('El valor declarado debe ser mayor a cero');
  if (declarado > Number(maximoCop)) {
    throw new Error(`El valor declarado ${declarado} supera el máximo de ${maximoCop} COP`);
  }
}
