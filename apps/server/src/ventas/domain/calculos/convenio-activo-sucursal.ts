export interface ConvenioSucursal {
  convenioId: number;
  sucursalId: number;
  activo: boolean;
}

export function verificarConvenioActivoSucursal(
  conveniosSucursal: ConvenioSucursal[],
  convenioId: number,
  sucursalId: number,
): boolean {
  const convenio = conveniosSucursal.find(
    (c) => c.convenioId === convenioId && c.sucursalId === sucursalId,
  );
  return convenio ? convenio.activo : false;
}
