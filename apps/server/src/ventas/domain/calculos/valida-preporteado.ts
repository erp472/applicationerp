export interface PermisoPreporteado {
  servicioId: number;
  permite: boolean;
}

export function validarPermitePreporteado(
  permisos: PermisoPreporteado[],
  servicioId: number,
): boolean {
  const permiso = permisos.find((p) => p.servicioId === servicioId);
  return permiso ? permiso.permite : false;
}
