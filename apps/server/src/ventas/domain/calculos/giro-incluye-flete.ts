export interface ReglaFlete {
  operador: string;
  incluyeFlete: boolean;
}

export function verificarGiroIncluyeFlete(
  operador: string,
  reglas: ReglaFlete[],
): boolean {
  const regla = reglas.find((r) => r.operador === operador);
  return regla ? regla.incluyeFlete : false;
}
