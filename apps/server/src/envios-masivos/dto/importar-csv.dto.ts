import { z } from 'zod';

// Formato original (10 cols) — solo destinatario, usa remitente del lote:
//   nombre,documento,email,telefono,direccion,ciudad,pais,codigoPostal,pesoKg,contenido
//
// Formato extendido (17 cols) — remitente propio por fila:
//   remNombre,remDocumento,remEmail,remTelefono,remDireccion,remCiudad,remCp,
//   nombre,documento,email,telefono,direccion,ciudad,pais,codigoPostal,pesoKg,contenido

export const ImportarCsvSchema = z.object({
  csv: z.string().min(1, 'El CSV no puede estar vacío'),
});

export type ImportarCsvDto = z.infer<typeof ImportarCsvSchema>;

export interface CsvFilaRemitente {
  nombre:       string;
  documento?:   string;
  email?:       string;
  telefono?:    string;
  direccion?:   string;
  ciudad?:      string;
  cp?:          string;
}

export interface CsvFila {
  remitente?:   CsvFilaRemitente;
  nombre:       string;
  documento?:   string;
  email?:       string;
  telefono?:    string;
  direccion?:   string;
  ciudad?:      string;
  pais:         string;
  codigoPostal?: string;
  pesoKg:       number;
  contenido?:   string;
}

export interface CsvParseResult {
  filas:   CsvFila[];
  errores: Array<{ fila: number; error: string }>;
}
