export interface IvaApartadoResult {
  precioSinTax: string;
  iva: string;
  precioTotal: string;
  incluyeIva: boolean;
}

// Calcula IVA del apartado según flag del schema (incluye_iva, default True)
export function calcularIvaApartado(
  precioSinTax: string,
  porcentajeTax: string,
  incluyeIva: boolean = true,
): IvaApartadoResult {
  const sinTax = Number(precioSinTax);
  const iva = incluyeIva ? Math.round(sinTax * Number(porcentajeTax) / 100) : 0;
  return {
    precioSinTax,
    iva: iva.toString(),
    precioTotal: (sinTax + iva).toString(),
    incluyeIva,
  };
}
