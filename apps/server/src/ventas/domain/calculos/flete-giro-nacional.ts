export interface TramoFlete {
  valorMin: string;
  valorMax: string;
  flete: string;
}

export function calcularFleteGiroNacional(
  valorGiro: string,
  tablaFletes: TramoFlete[],
): string {
  const giro = Number(valorGiro);
  const tramo = tablaFletes.find(
    (t) => Number(t.valorMin) <= giro && giro <= Number(t.valorMax),
  );
  if (!tramo) throw new Error(`No se encontró flete para giro de ${valorGiro} COP`);
  return tramo.flete;
}
