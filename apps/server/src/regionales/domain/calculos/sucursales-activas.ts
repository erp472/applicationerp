export interface SucursalActividad {
  sucursalId: number;
  tieneSesionAbiertaHoy: boolean;
}

export interface SucursalesActivasResult {
  total: number;
  activas: number;
  inactivas: number;
  pctActivas: number;
}

export function calcularSucursalesActivas(
  sucursales: SucursalActividad[],
): SucursalesActivasResult {
  const total = sucursales.length;
  const activas = sucursales.filter((s) => s.tieneSesionAbiertaHoy).length;
  const pctActivas = total > 0 ? Math.round((activas / total) * 10000) / 100 : 0;
  return { total, activas, inactivas: total - activas, pctActivas };
}
