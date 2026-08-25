import { describe, it, expect } from 'vitest';
import { parsearCsv } from './parsear-csv.js';

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// El parser detecta cabecera cuando la primera celda de la primera fila no es
// un número. Por eso todos los CSV de prueba incluyen la fila de encabezado.
// ────────────────────────────────────────────────────────────────────────────────

const HEADER_ORIG = 'nombre,documento,email,telefono,direccion,ciudad,pais,cp,pesoKg,contenido';
const HEADER_EXT  = 'remNombre,remDoc,remEmail,remTel,remDir,remCiudad,remCp,nombre,documento,email,telefono,direccion,ciudad,pais,cp,pesoKg,contenido';

const datoOrig = (overrides: Partial<Record<string, string>> = {}): string => {
  const d = { nombre: 'Juan Perez', documento: '123456', email: '', telefono: '3001234567',
               direccion: 'Calle 1', ciudad: 'Bogotá', pais: 'CO', cp: '110001',
               pesoKg: '1.5', contenido: 'Libros', ...overrides };
  return [d.nombre, d.documento, d.email, d.telefono, d.direccion, d.ciudad, d.pais, d.cp, d.pesoKg, d.contenido].join(',');
};

const datoExt = (overrides: Partial<Record<string, string>> = {}): string => {
  const d = { remNombre: 'Empresa SA', remDoc: 'NIT-123', remEmail: 'empresa@mail.com',
               remTel: '6001234', remDir: 'Av Principal', remCiudad: 'Cali', remCp: '760001',
               nombre: 'Juan Perez', documento: 'CC-456', email: 'juan@mail.com',
               telefono: '3001234567', direccion: 'Calle 1', ciudad: 'Bogotá',
               pais: 'CO', cp: '110001', pesoKg: '2.5', contenido: 'Documentos', ...overrides };
  return [d.remNombre, d.remDoc, d.remEmail, d.remTel, d.remDir, d.remCiudad, d.remCp,
          d.nombre, d.documento, d.email, d.telefono, d.direccion, d.ciudad, d.pais, d.cp,
          d.pesoKg, d.contenido].join(',');
};

const csvOrig = (...datos: string[]) => `${HEADER_ORIG}\n${datos.join('\n')}`;
const csvExt  = (...datos: string[]) => `${HEADER_EXT}\n${datos.join('\n')}`;

// ────────────────────────────────────────────────────────────────────────────────
// Formato original (10 columnas — solo destinatario)
// ────────────────────────────────────────────────────────────────────────────────

describe('parsearCsv — formato original (10 cols)', () => {
  it('parsea una fila válida con cabecera', () => {
    const { filas, errores } = parsearCsv(csvOrig(datoOrig()));

    expect(errores).toHaveLength(0);
    expect(filas).toHaveLength(1);
    expect(filas[0].nombre).toBe('Juan Perez');
    expect(filas[0].documento).toBe('123456');
    expect(filas[0].pesoKg).toBe(1.5);
    expect(filas[0].pais).toBe('CO');
    expect(filas[0].remitente).toBeUndefined();
  });

  it('omite la cabecera cuando la primera celda no es número', () => {
    const { filas } = parsearCsv(csvOrig(datoOrig()));
    expect(filas).toHaveLength(1);
    expect(filas[0].nombre).toBe('Juan Perez');
  });

  it('incluye la primera fila como dato cuando empieza con número (sin cabecera)', () => {
    const csv = `1,CC-100,,,,,CO,,0.5,\n${datoOrig()}`;
    const { filas } = parsearCsv(csv);
    expect(filas).toHaveLength(2);
    expect(filas[0].nombre).toBe('1');
  });

  it('usa CO como país por defecto cuando la celda está vacía', () => {
    const { filas } = parsearCsv(csvOrig(datoOrig({ pais: '' })));
    expect(filas[0].pais).toBe('CO');
  });

  it('detecta separador punto y coma', () => {
    const header = HEADER_ORIG.replace(/,/g, ';');
    const dato = ['Ana Torres', '789', '', '', '', 'Medellín', 'CO', '', '0.8', ''].join(';');
    const { filas, errores } = parsearCsv(`${header}\n${dato}`);
    expect(errores).toHaveLength(0);
    expect(filas[0].nombre).toBe('Ana Torres');
    expect(filas[0].pesoKg).toBe(0.8);
  });

  it('parsea peso con coma decimal en CSV separado por punto y coma', () => {
    // La coma decimal solo es posible cuando el separador de campo es ";"
    const header = HEADER_ORIG.replace(/,/g, ';');
    const dato = ['Juan Perez', '123456', '', '', 'Calle 1', 'Bogotá', 'CO', '110001', '1,5', 'Libros'].join(';');
    const { filas } = parsearCsv(`${header}\n${dato}`);
    expect(filas[0].pesoKg).toBe(1.5);
  });

  it('parsea múltiples filas de envíos masivos', () => {
    const csv = csvOrig(
      datoOrig(),
      datoOrig({ nombre: 'Pedro Gomez', documento: '654321', telefono: '3109999999', ciudad: 'Cali', pesoKg: '3', contenido: 'Ropa' }),
      datoOrig({ nombre: 'Lucia Reyes', documento: '111222', telefono: '', ciudad: 'Barranquilla', cp: '', pesoKg: '0.5', contenido: '' }),
    );

    const { filas, errores } = parsearCsv(csv);
    expect(errores).toHaveLength(0);
    expect(filas).toHaveLength(3);
    expect(filas[1].nombre).toBe('Pedro Gomez');
    expect(filas[2].nombre).toBe('Lucia Reyes');
  });

  it('omite líneas en blanco entre filas de datos', () => {
    const csv = `${HEADER_ORIG}\n${datoOrig()}\n\n${datoOrig({ nombre: 'Maria Lopez' })}`;
    const { filas } = parsearCsv(csv);
    expect(filas).toHaveLength(2);
  });

  it('campos opcionales undefined cuando la celda está vacía', () => {
    const { filas } = parsearCsv(csvOrig(datoOrig({ documento: '', email: '', telefono: '', contenido: '' })));
    expect(filas[0].documento).toBeUndefined();
    expect(filas[0].email).toBeUndefined();
    expect(filas[0].telefono).toBeUndefined();
    expect(filas[0].contenido).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// Formato extendido (17 columnas — remitente propio por fila)
// ────────────────────────────────────────────────────────────────────────────────

describe('parsearCsv — formato extendido (17 cols, multi-origen)', () => {
  it('parsea remitente y destinatario correctamente', () => {
    const { filas, errores } = parsearCsv(csvExt(datoExt()));

    expect(errores).toHaveLength(0);
    expect(filas).toHaveLength(1);

    const fila = filas[0];
    expect(fila.nombre).toBe('Juan Perez');
    expect(fila.remitente?.nombre).toBe('Empresa SA');
    expect(fila.remitente?.documento).toBe('NIT-123');
    expect(fila.remitente?.email).toBe('empresa@mail.com');
    expect(fila.remitente?.ciudad).toBe('Cali');
    expect(fila.pesoKg).toBe(2.5);
    expect(fila.pais).toBe('CO');
  });

  it('crea envíos masivos para múltiples orígenes distintos', () => {
    const csv = csvExt(
      datoExt(),
      datoExt({ remNombre: 'Bodega Norte', remDoc: 'NIT-999', remCiudad: 'Bucaramanga',
                nombre: 'Carlos Ruiz', documento: 'CC-789', ciudad: 'Pereira', pesoKg: '5', contenido: 'Electrodomésticos' }),
    );

    const { filas, errores } = parsearCsv(csv);
    expect(errores).toHaveLength(0);
    expect(filas).toHaveLength(2);
    expect(filas[0].remitente?.nombre).toBe('Empresa SA');
    expect(filas[1].remitente?.nombre).toBe('Bodega Norte');
    expect(filas[1].nombre).toBe('Carlos Ruiz');
  });

  it('acepta remitente vacío en formato extendido (usa remitente del lote)', () => {
    const csv = csvExt(datoExt({ remNombre: '', remDoc: '', remEmail: '', remTel: '', remDir: '', remCiudad: '', remCp: '' }));

    const { filas, errores } = parsearCsv(csv);
    expect(errores).toHaveLength(0);
    expect(filas[0].remitente).toBeUndefined();
    expect(filas[0].nombre).toBe('Juan Perez');
  });

  it('omite cabecera en formato extendido', () => {
    const csv = csvExt(datoExt());
    const { filas } = parsearCsv(csv);
    expect(filas).toHaveLength(1);
  });

  it('detecta formato extendido por 17 columnas (no por 10)', () => {
    const r10 = parsearCsv(csvOrig(datoOrig()));
    const r17 = parsearCsv(csvExt(datoExt()));

    expect(r10.filas[0].remitente).toBeUndefined();
    expect(r17.filas[0].remitente).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// Errores de validación
// ────────────────────────────────────────────────────────────────────────────────

describe('parsearCsv — validación y errores', () => {
  it('registra error si nombre destinatario está vacío (formato original)', () => {
    const { filas, errores } = parsearCsv(csvOrig(datoOrig({ nombre: '' })));
    expect(filas).toHaveLength(0);
    expect(errores[0].error).toMatch(/nombre requerido/i);
  });

  it('registra error si el peso es 0', () => {
    const { filas, errores } = parsearCsv(csvOrig(datoOrig({ pesoKg: '0' })));
    expect(filas).toHaveLength(0);
    expect(errores[0].error).toMatch(/peso inválido/i);
  });

  it('registra error si el peso es negativo', () => {
    const { errores } = parsearCsv(csvOrig(datoOrig({ pesoKg: '-1' })));
    expect(errores[0].error).toMatch(/peso inválido/i);
  });

  it('registra error si el peso no es un número', () => {
    const { errores } = parsearCsv(csvOrig(datoOrig({ pesoKg: 'abc' })));
    expect(errores[0].error).toMatch(/peso inválido/i);
  });

  it('registra error si el peso está vacío', () => {
    const { errores } = parsearCsv(csvOrig(datoOrig({ pesoKg: '' })));
    expect(errores[0].error).toMatch(/peso inválido/i);
  });

  it('número de fila en error corresponde al número de línea del CSV (línea 3 = fila 3)', () => {
    const csv = csvOrig(
      datoOrig(),
      datoOrig({ nombre: '' }),
    );
    const { errores } = parsearCsv(csv);
    expect(errores[0].fila).toBe(3);
  });

  it('procesa filas válidas e inválidas en el mismo CSV', () => {
    const csv = csvOrig(
      datoOrig(),
      datoOrig({ nombre: '' }),
      datoOrig({ nombre: 'Maria Lopez' }),
    );

    const { filas, errores } = parsearCsv(csv);
    expect(filas).toHaveLength(2);
    expect(errores).toHaveLength(1);
  });

  it('registra error formato extendido si faltan ambos remitente y destinatario', () => {
    const csv = csvExt(datoExt({ remNombre: '', nombre: '' }));
    const { errores } = parsearCsv(csv);
    expect(errores[0].error).toMatch(/requerido/i);
  });

  it('registra error formato extendido si nombre destinatario está vacío con remitente presente', () => {
    const csv = csvExt(datoExt({ nombre: '' }));
    const { errores } = parsearCsv(csv);
    expect(errores[0].error).toMatch(/nombre destinatario requerido/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// Escenario masivo: lote de 50 correos
// ────────────────────────────────────────────────────────────────────────────────

describe('parsearCsv — lote masivo', () => {
  it('parsea 50 envíos sin errores (formato original)', () => {
    const lineasDato = Array.from({ length: 50 }, (_, i) =>
      datoOrig({ nombre: `Destinatario ${i + 1}`, documento: `CC-${1000 + i}`, pesoKg: `${(i + 1) * 0.5}` }),
    );
    const { filas, errores } = parsearCsv(csvOrig(...lineasDato));
    expect(filas).toHaveLength(50);
    expect(errores).toHaveLength(0);
  });

  it('parsea 50 envíos multi-origen (formato extendido)', () => {
    const lineasDato = Array.from({ length: 50 }, (_, i) =>
      datoExt({
        remNombre: `Empresa ${i + 1}`, remDoc: `NIT-${i}`,
        nombre: `Destinatario ${i + 1}`, documento: `CC-${i}`,
        pesoKg: `${((i + 1) * 0.3).toFixed(1)}`,
      }),
    );
    const { filas, errores } = parsearCsv(csvExt(...lineasDato));
    expect(filas).toHaveLength(50);
    expect(errores).toHaveLength(0);
    expect(filas[0].remitente?.nombre).toBe('Empresa 1');
    expect(filas[49].remitente?.nombre).toBe('Empresa 50');
  });

  it('mezcla válidos e inválidos en lote masivo', () => {
    const lineasDato = Array.from({ length: 10 }, (_, i) =>
      i % 3 === 0
        ? datoOrig({ nombre: '' })
        : datoOrig({ nombre: `Dest ${i}`, pesoKg: `${i + 0.5}` }),
    );
    const { filas, errores } = parsearCsv(csvOrig(...lineasDato));
    expect(filas.length + errores.length).toBe(10);
    expect(errores.length).toBeGreaterThan(0);
  });
});
