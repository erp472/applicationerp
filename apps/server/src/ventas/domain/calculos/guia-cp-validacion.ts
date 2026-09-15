const PATRON_CP = /^[A-Z]{2}\d{8}[A-Z]{2}$/;

export function validarGuiaCp(guiaCp: string, guiasExistentes: string[]): void {
  const normalizada = guiaCp.trim().toUpperCase();
  if (!PATRON_CP.test(normalizada)) {
    throw new Error(`Formato de guía CP inválido: '${guiaCp}'. Esperado: LLddddddddLL`);
  }
  const existentes = new Set(guiasExistentes.map((g) => g.toUpperCase()));
  if (existentes.has(normalizada)) {
    throw new Error(`La guía CP '${guiaCp}' ya está registrada en el sistema`);
  }
}
