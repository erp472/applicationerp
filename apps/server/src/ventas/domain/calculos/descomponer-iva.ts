export interface DescomposicionIva {
  precioSinTax: number;
  ivaUnitario: number;
  precioBruto: number;
}

// Extrae IVA del precio bruto. El bruto ya incluye IVA.
// iva = bruto - bruto/(1 + t/100). NUNCA bruto × tasa directa.
export function descomponerIva(
  precioBruto: number,
  porcentajeTax: number,
  precioSinTaxExplicito?: number,
): DescomposicionIva {
  const sinTax =
    precioSinTaxExplicito !== undefined
      ? precioSinTaxExplicito
      : precioBruto / (1 + porcentajeTax / 100);
  return {
    precioSinTax: sinTax,
    ivaUnitario: precioBruto - sinTax,
    precioBruto,
  };
}
