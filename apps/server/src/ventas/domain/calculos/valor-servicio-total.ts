export function calcularValorServicioTotal(
  tarifaBase: string,
  valorKgAdicional: string,
): string {
  const total = Number(tarifaBase) + Number(valorKgAdicional);
  return String(Math.round(total));
}
