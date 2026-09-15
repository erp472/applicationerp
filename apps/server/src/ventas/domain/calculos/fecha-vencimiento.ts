// Añade meses a una fecha respetando fin de mes (como Python's relativedelta).
// e.g. 2025-01-31 + 1 mes = 2025-02-28 (no 2025-03-03)
function addMonthsDate(dateStr: string, months: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const result = new Date(y, m - 1 + months, d);
  // Si el día se desbordó al mes siguiente, retroceder al último día del mes esperado
  if (result.getDate() !== d) result.setDate(0);
  return result;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// fecha_fin = fecha_inicio + meses_contratados (maneja fin de mes y bisiestos)
export function calcularFechaVencimiento(fechaInicio: string, mesesContratados: number): string {
  if (mesesContratados <= 0) throw new Error('Los meses contratados deben ser positivos');
  return toISO(addMonthsDate(fechaInicio, mesesContratados));
}
