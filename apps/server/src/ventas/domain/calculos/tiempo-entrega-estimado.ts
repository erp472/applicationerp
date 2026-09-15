function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function calcularTiempoEntregaEstimado(
  hoy: Date,
  tiempoEntregaDias: number,
  festivosColombia?: Date[] | null,
): Date {
  const festivos = new Set((festivosColombia ?? []).map(localDateKey));
  let diasContados = 0;
  const fecha = new Date(hoy);
  while (diasContados < tiempoEntregaDias) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    const esDomingo  = dia === 0;
    const esSabado   = dia === 6;
    const esFestivo  = festivos.has(localDateKey(fecha));
    if (!esDomingo && !esSabado && !esFestivo) diasContados++;
  }
  return fecha;
}
