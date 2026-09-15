export function calcularValorRecaudo(
  valorBase: string,
  comisionOperador = '0',
): string {
  return String(Number(valorBase) + Number(comisionOperador));
}
