export interface LineaCarrito {
  precioSinTax: number;
  ivaUnitario: number;
  cantidad: number;
  descuentoMonto?: number;
}

export interface TotalesCarrito {
  subtotalSinIva: string;
  ivaTotal: string;
  descuentoTotal: string;
  total: string;
}

// Suma totales del carrito usando precio_sin_tax e iva_unitario ya descompuestos
export function calcularTotalCarrito(lineas: LineaCarrito[]): TotalesCarrito {
  let subtotalSinIva = 0;
  let ivaTotal = 0;
  let descuentoTotal = 0;
  for (const l of lineas) {
    subtotalSinIva += l.precioSinTax * l.cantidad;
    ivaTotal += l.ivaUnitario * l.cantidad;
    descuentoTotal += l.descuentoMonto ?? 0;
  }
  const total = subtotalSinIva + ivaTotal - descuentoTotal;
  return {
    subtotalSinIva: subtotalSinIva.toFixed(2),
    ivaTotal: ivaTotal.toFixed(2),
    descuentoTotal: descuentoTotal.toFixed(2),
    total: total.toFixed(2),
  };
}
