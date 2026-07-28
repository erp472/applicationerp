import { randomInt } from 'crypto';

export function generarPinGiroNacional(pinsExistentes: Set<string>): string {
  for (let i = 0; i < 100; i++) {
    const pin = String(randomInt(1_000_000)).padStart(6, '0');
    if (!pinsExistentes.has(pin)) return pin;
  }
  throw new Error('No se pudo generar un PIN único en 100 intentos — revisar colisiones');
}
