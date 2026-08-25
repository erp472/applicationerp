import type { CsvFila, CsvParseResult } from '../dto/importar-csv.dto.js';

export function parsearCsv(texto: string): CsvParseResult {
  const lineas = texto.trim().split(/\r?\n/);
  const filas: CsvFila[] = [];
  const errores: CsvParseResult['errores'] = [];

  const separador = (lineas[0]?.split(';').length ?? 0) > (lineas[0]?.split(',').length ?? 0)
    ? ';'
    : ',';

  const inicio = isNaN(Number(lineas[0]?.split(separador)[0])) ? 1 : 0;

  const primeraFila = lineas[inicio]?.split(separador) ?? [];
  const esFormatoExtendido = primeraFila.length >= 17;

  for (let i = inicio; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;

    const celdas = linea.split(separador).map(c => c.trim().replace(/^["']|["']$/g, ''));

    if (esFormatoExtendido) {
      // Formato: remNombre(0),remDoc(1),remEmail(2),remTel(3),remDir(4),remCiudad(5),remCp(6),
      //          destNombre(7),destDoc(8),destEmail(9),destTel(10),destDir(11),destCiudad(12),destPais(13),destCp(14),
      //          pesoKg(15),contenido(16)
      const [
        remNombre, remDoc, remEmail, remTel, remDir, remCiudad, remCp,
        nombre, documento, email, telefono, direccion, ciudad, pais, codigoPostal,
        pesoRaw, contenido,
      ] = celdas;

      if (!remNombre && !nombre) {
        errores.push({ fila: i + 1, error: 'Remitente y destinatario son requeridos' });
        continue;
      }
      if (!nombre) {
        errores.push({ fila: i + 1, error: 'Nombre destinatario requerido' });
        continue;
      }

      const pesoKg = parseFloat(pesoRaw?.replace(',', '.') ?? '');
      if (isNaN(pesoKg) || pesoKg <= 0) {
        errores.push({ fila: i + 1, error: `Peso inválido: "${pesoRaw}"` });
        continue;
      }

      filas.push({
        remitente: remNombre ? {
          nombre:    remNombre,
          documento: remDoc    || undefined,
          email:     remEmail  || undefined,
          telefono:  remTel    || undefined,
          direccion: remDir    || undefined,
          ciudad:    remCiudad || undefined,
          cp:        remCp     || undefined,
        } : undefined,
        nombre,
        documento:    documento    || undefined,
        email:        email        || undefined,
        telefono:     telefono     || undefined,
        direccion:    direccion    || undefined,
        ciudad:       ciudad       || undefined,
        pais:         pais         || 'CO',
        codigoPostal: codigoPostal || undefined,
        pesoKg,
        contenido:    contenido    || undefined,
      });
    } else {
      // Formato original: nombre(0),doc(1),email(2),tel(3),dir(4),ciudad(5),pais(6),cp(7),pesoKg(8),contenido(9)
      const [nombre, documento, email, telefono, direccion, ciudad, pais, codigoPostal, pesoRaw, contenido] = celdas;

      if (!nombre) {
        errores.push({ fila: i + 1, error: 'Nombre requerido' });
        continue;
      }

      const pesoKg = parseFloat(pesoRaw?.replace(',', '.') ?? '');
      if (isNaN(pesoKg) || pesoKg <= 0) {
        errores.push({ fila: i + 1, error: `Peso inválido: "${pesoRaw}"` });
        continue;
      }

      filas.push({
        nombre,
        documento:    documento    || undefined,
        email:        email        || undefined,
        telefono:     telefono     || undefined,
        direccion:    direccion    || undefined,
        ciudad:       ciudad       || undefined,
        pais:         pais         || 'CO',
        codigoPostal: codigoPostal || undefined,
        pesoKg,
        contenido:    contenido    || undefined,
      });
    }
  }

  return { filas, errores };
}
