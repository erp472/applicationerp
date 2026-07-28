export interface LineaIva {
  precioBruto: string;
  precioSinTax: string;
  cantidad: number;
}

export function calcularIvaVenta(lineas: LineaIva[]): string {
  const total = lineas.reduce((acc, l) => {
    const ivaUnit = Number(l.precioBruto) - Number(l.precioSinTax);
    return acc + ivaUnit * l.cantidad;
  }, 0);
  return String(total);
}
