export interface LineaGravable {
  precioSinTax: string;
  cantidad: number;
}

export function calcularBaseGravable(lineas: LineaGravable[]): string {
  const total = lineas.reduce(
    (acc, l) => acc + Number(l.precioSinTax) * l.cantidad,
    0,
  );
  return String(total);
}
