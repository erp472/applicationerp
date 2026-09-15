/** Campos que nunca deben quedar registrados en auditoría. El middleware de Prisma
 *  vuelca la fila completa, así que sin esto los hashes de `usuarios.password_hashusuarios`
 *  terminan en el log —y, vía WebSocket, en cada cliente conectado. */
const SENSIBLE = /password|hash|token|secret|clave|contrasen/i;

export const REDACTADO = '[REDACTADO]';

/** Reemplaza el valor de las claves sensibles, conservando su presencia para que la
 *  traza siga mostrando que el campo cambió. */
export function redact(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(redact);
  if (valor === null || typeof valor !== 'object') return valor;
  if (valor instanceof Date) return valor;

  const salida: Record<string, unknown> = {};
  for (const [clave, v] of Object.entries(valor as Record<string, unknown>)) {
    salida[clave] = SENSIBLE.test(clave) ? REDACTADO : redact(v);
  }
  return salida;
}
