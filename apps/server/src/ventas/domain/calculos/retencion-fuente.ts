const TIPOS_CON_RETENCION = new Set(['corporativo', 'expendio']);

export function calcularRetencionFuente(
  baseGravable: string,
  pctRetencion: string,
  tipoCliente: string,
  totalVenta: string,
  topeDian: string,
): string {
  if (!TIPOS_CON_RETENCION.has(tipoCliente)) return '0';
  if (Number(totalVenta) < Number(topeDian)) return '0';
  const retencion = (Number(baseGravable) * Number(pctRetencion)) / 100;
  return String(Math.round(retencion));
}
