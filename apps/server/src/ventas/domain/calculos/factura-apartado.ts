export interface FacturaApartadoResult {
  venta: {
    clienteId: number;
    apartadoPostalId: number;
    subtotal: string;
    iva: string;
    descuento: string;
    total: string;
  };
  detalle: {
    descripcion: string;
    cantidad: 1;
    precioUnitario: string;
    ivaUnitario: string;
    subtotal: string;
  };
  factura: {
    emailFactura: string | null;
    apartadoPostalId: number;
  };
}

// Genera payload de Venta + VentaDetalle + Factura para el apartado postal
export function buildFacturaApartado(
  apartadoId: number,
  precioTotal: string,
  iva: string,
  precioSinTax: string,
  clienteId: number,
  emailFactura: string | null = null,
): FacturaApartadoResult {
  return {
    venta: {
      clienteId,
      apartadoPostalId: apartadoId,
      subtotal: precioSinTax,
      iva,
      descuento: '0',
      total: precioTotal,
    },
    detalle: {
      descripcion: `Apartado postal #${apartadoId}`,
      cantidad: 1,
      precioUnitario: precioSinTax,
      ivaUnitario: iva,
      subtotal: precioTotal,
    },
    factura: { emailFactura, apartadoPostalId: apartadoId },
  };
}
