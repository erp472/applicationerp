export function calcularSeguroPostal(
  valorDeclarado: string,
  porcentajeSeguro: string,
  minimoSeguro = 0,
): string {
  const declarado = Number(valorDeclarado);
  if (declarado < 0) throw new Error('El valor declarado no puede ser negativo');
  const seguro = (declarado * Number(porcentajeSeguro)) / 100;
  return String(Math.max(Math.round(seguro), minimoSeguro));
}
