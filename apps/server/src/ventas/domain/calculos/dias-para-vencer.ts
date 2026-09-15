// dias_restantes = fecha_fin − hoy. Negativo si ya venció.
export function calcularDiasParaVencer(fechaFin: string, hoy?: string): number {
  const fin = new Date(fechaFin + 'T00:00:00');
  const desde = hoy ? new Date(hoy + 'T00:00:00') : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
  return Math.round((fin.getTime() - desde.getTime()) / 86_400_000);
}
