import * as fs   from 'node:fs';
import * as path from 'node:path';
import * as url  from 'node:url';
import type { EnvioEntity } from './venta.entity.js';

const __dir = path.dirname(url.fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dir, 'guia-template.svg');

// ── Formateadores ─────────────────────────────────────────────────────────────

const copFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 });

function fmtDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtCop(v: number | null | undefined): string {
  return v != null ? copFmt.format(v).replace(/\$\s?/, '') : '';
}
function fmtKg(v: number | null | undefined): string {
  return v != null ? numFmt.format(v) : '';
}

// ── Tipo de datos de la guía (coincide con guia-data.json) ────────────────────

export interface GuiaData {
  centroOperativo:               string;
  fechaAdmision:                 string;
  fechaApproxEntrega:            string;
  remitenteNombre:               string;
  remitenteDireccion:            string;
  remitenteReferencia:           string;
  remitenteNit:                  string;
  remitenteCiudad:               string;
  remitenteDepto:                string;
  remitenteTelefono:             string;
  remitenteCP:                   string;
  destinatarioNombre:            string;
  destinatarioDireccion:         string;
  destinatarioReferencia:        string;
  destinatarioCiudad:            string;
  destinatarioDepto:             string;
  destinatarioTel:               string;
  destinatarioCP:                string;
  codigoOperativo:               string;
  pesoFisico:                    string;
  pesoVolumetrico:               string;
  pesoFacturado:                 string;
  valorDeclarado:                string;
  valorFlete:                    string;
  costoManejo:                   string;
  valorTotal:                    string;
  observaciones:                 string;
  diceContener:                  string;
  barcodeText1:                  string;
  barcodeText2:                  string;
  fechaEntrega:                  string;
  codigoGuia:                    string;
  fechaPlaceholder1:             string;
  fechaPlaceholder2:             string;
  codigoOperativoBajo:           string;
  barcodeLineal:                 string;
  lateral_destinatarioNombre:    string;
  lateral_destinatarioDireccion: string;
  lateral_destinatarioCiudad:    string;
  lateral_destinatarioDepto:     string;
  lateral_destinatarioCP:        string;
  lateral_fechaAdmision:         string;
  lateral_remitenteNombre:       string;
  lateral_remitenteDireccion:    string;
  lateral_remitenteCiudad:       string;
  lateral_remitenteDepto:        string;
  lateral_remitenteCP:           string;
  lateral_envio:                 string;
  pieLegal1:                     string;
  pieLegal2:                     string;
  pieLegal3:                     string;
  lateral_derecho_centro:        string;
  lateral_derecho_codigo:        string;
}

// ── Mapa tspan-ID → campo (refleja exactamente el CAMPOS del SVG) ─────────────

const CAMPOS: Record<keyof GuiaData, { id: string; max: number }> = {
  // El clip del slot mide 67.8 unidades y Helvetica 5px gasta ~2.34 por carácter,
  // así que entran ~28. Con 18 se perdía la palabra que identifica el centro
  // ("Medellín El Poblado" quedaba en "Medellín El") sin necesidad.
  centroOperativo:               { id: 'tspan80',                             max: 28  },
  fechaAdmision:                 { id: 'tspan106',                            max: 14  },
  fechaApproxEntrega:            { id: 'tspan146',                            max: 14  },
  remitenteNombre:               { id: 'tspan332',                            max: 45  },
  remitenteDireccion:            { id: 'tspan348',                            max: 48  },
  remitenteReferencia:           { id: 'tspan_remitenteReferencia',           max: 40  },
  remitenteNit:                  { id: 'tspan364',                            max: 20  },
  remitenteCiudad:               { id: 'tspan392',                            max: 28  },
  remitenteDepto:                { id: 'tspan408',                            max: 25  },
  remitenteTelefono:             { id: 'tspan424',                            max: 15  },
  remitenteCP:                   { id: 'tspan440',                            max: 10  },
  destinatarioNombre:            { id: 'tspan456',                            max: 45  },
  destinatarioDireccion:         { id: 'tspan472',                            max: 48  },
  destinatarioReferencia:        { id: 'tspan_destinatarioReferencia',        max: 55  },
  destinatarioCiudad:            { id: 'tspan488',                            max: 28  },
  destinatarioDepto:             { id: 'tspan504',                            max: 25  },
  destinatarioTel:               { id: 'tspan520',                            max: 15  },
  destinatarioCP:                { id: 'tspan_destinatarioCP',                 max: 10  },
  codigoOperativo:               { id: 'tspan544',                            max: 15  },
  pesoFisico:                    { id: 'tspan576',                            max: 8   },
  pesoVolumetrico:               { id: 'tspan592',                            max: 8   },
  pesoFacturado:                 { id: 'tspan608',                            max: 8   },
  valorDeclarado:                { id: 'tspan624',                            max: 12  },
  valorFlete:                    { id: 'tspan640',                            max: 12  },
  costoManejo:                   { id: 'tspan656',                            max: 12  },
  valorTotal:                    { id: 'tspan672',                            max: 12  },
  // Estos dos se reparten en renglones de continuación (data-wrap) durante el
  // render en puppeteer, así que el tope cubre el total de la celda, no un renglón.
  observaciones:                 { id: 'tspan704',                            max: 130 },
  diceContener:                  { id: 'tspan_diceContener',                  max: 105 },
  barcodeText1:                  { id: 'tspan740',                            max: 14  },
  barcodeText2:                  { id: 'tspan744',                            max: 14  },
  fechaEntrega:                  { id: 'tspan812',                            max: 14  },
  codigoGuia:                    { id: 'tspan1238',                           max: 20  },
  fechaPlaceholder1:             { id: 'tspan1250',                           max: 12  },
  fechaPlaceholder2:             { id: 'tspan1262',                           max: 12  },
  codigoOperativoBajo:           { id: 'tspan1306',                           max: 15  },
  barcodeLineal:                 { id: 'tspan1324',                           max: 24  },
  lateral_destinatarioNombre:    { id: 'tspan_lateral_destinatarioNombre',    max: 24  },
  lateral_destinatarioDireccion: { id: 'tspan_lateral_destinatarioDireccion', max: 24  },
  lateral_destinatarioCiudad:    { id: 'tspan_lateral_destinatarioCiudad',    max: 24  },
  lateral_destinatarioDepto:     { id: 'tspan_lateral_destinatarioDepto',     max: 18  },
  lateral_destinatarioCP:        { id: 'tspan_lateral_destinatarioCP',        max: 18  },
  lateral_fechaAdmision:         { id: 'tspan_lateral_fechaAdmision',         max: 20  },
  lateral_remitenteNombre:       { id: 'tspan_lateral_remitenteNombre',       max: 25  },
  lateral_remitenteDireccion:    { id: 'tspan_lateral_remitenteDireccion',    max: 25  },
  lateral_remitenteCiudad:       { id: 'tspan_lateral_remitenteCiudad',       max: 25  },
  lateral_remitenteDepto:        { id: 'tspan_lateral_remitenteDepto',        max: 18  },
  lateral_remitenteCP:           { id: 'tspan_lateral_remitenteCP',           max: 18  },
  lateral_envio:                 { id: 'tspan_lateral_envio',                 max: 18  },
  pieLegal1:                     { id: 'tspan_pieLegal1',                     max: 320 },
  pieLegal2:                     { id: 'tspan_pieLegal2',                     max: 320 },
  pieLegal3:                     { id: 'tspan_pieLegal3',                     max: 100 },
  // Este slot trae textLength="110" fijo en la plantilla, así que el texto se
  // condensa solo; el tope sólo evita que se vuelva ilegible.
  lateral_derecho_centro:        { id: 'tspan_lateral_derecho_centro',        max: 24  },
  lateral_derecho_codigo:        { id: 'tspan_lateral_derecho_codigo',        max: 8   },
};

// ── Textos legales fijos ──────────────────────────────────────────────────────

const PIE1 = 'Principal: Bogotá D.C. Colombia Diagonal 25 G # 95 A 55 Bogotá / www.4-72.com.co Línea Nacional: 01 8000 111 210 / Tel. contacto: (571) 4722000. Min. Transporte, Lic. de carga 000200 del 20 de mayo de 2011/Min.TIC, Res. Mensajería Expresa 001967 de 9 septiembre del 2011';
const PIE2 = 'El usuario deja expresa constancia que tuvo conocimiento del contrato que se encuentra publicado en la pagina web, 4-72 tratará sus datos personales para probar la entrega del envío. Para ejercer algún reclamo: servicioalcliente@4-72.com.co Para consultar la Política de';
const PIE3 = 'Tratamiento: www.4-72.com.co';

// ── Info de la sucursal (código + nombre visible en franja derecha) ────────────

export interface SucursalGuiaInfo {
  codigo: string;
  nombre: string;
}

export interface ServicioGuiaInfo {
  codigo: string;
  nombre: string;
}

// El slot vertical de la franja derecha sólo admite 8 caracteres, así que el
// código de sucursal completo ("SUC-BOG-002") se recortaba a "SUC-BOG-". El
// tramo final es el que identifica el punto, así que es el que conservamos.
export function codigoCorto(codigoSucursal: string): string {
  const partes = codigoSucursal.split('-');
  return partes.length > 1 ? partes[partes.length - 1]! : codigoSucursal;
}

// Corta en el último espacio antes del límite para no partir una palabra por la
// mitad ("Chapinero Centro Alto" → "Chapinero" y no "Chapinero Cent").
export function truncarPalabra(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  const sep = corte.lastIndexOf(' ');
  return (sep > 0 ? corte.slice(0, sep) : corte).trimEnd();
}

// El POS compone la dirección como "<dirección>, <adición>" y la guarda en un
// solo campo, así que aquí se vuelve a separar para llenar el slot "Referencia:".
// Las direcciones normalizadas no traen coma en la parte principal.
export function partirDireccion(direccion: string): [string, string] {
  const i = direccion.indexOf(', ');
  if (i < 0) return [direccion, ''];
  return [direccion.slice(0, i), direccion.slice(i + 2)];
}

// ── Mapper EnvioEntity → GuiaData ────────────────────────────────────────────

export function buildGuiaData(
  envio:         EnvioEntity,
  servicio:      ServicioGuiaInfo,
  sucursal:      SucursalGuiaInfo,
  fechaEntrega?: Date,
): GuiaData {
  const admision  = fmtDate(envio.createdAt);
  const entrega   = fechaEntrega ? fmtDate(fechaEntrega) : '';
  const guia      = envio.numeroGuia;
  // El código S10 (RA185194038CO) es el que va en el código de barras; sólo
  // existe para servicios con rastreo, el resto cae al número de guía.
  const tracking  = envio.codigoTracking ?? guia;
  const costoExtra = (envio.valorEstampillas ?? 0)
                   + (envio.valorSeguro ?? 0)
                   + (envio.valorCertificacion ?? 0);
  const [remDir,  remRef]  = partirDireccion(envio.remitenteDireccion    ?? '');
  const [destDir, destRef] = partirDireccion(envio.destinatarioDireccion ?? '');

  return {
    centroOperativo:               truncarPalabra(sucursal.nombre, CAMPOS.centroOperativo.max),
    fechaAdmision:                 admision,
    fechaApproxEntrega:            entrega,

    remitenteNombre:               envio.remitenteNombre          ?? '',
    remitenteDireccion:            remDir,
    remitenteReferencia:           remRef,
    remitenteNit:                  envio.remitenteDocumento        ?? '',
    remitenteCiudad:               envio.remitenteCiudad           ?? '',
    remitenteDepto:                envio.remitenteDepartamento     ?? '',
    remitenteTelefono:             envio.remitenteTelefono         ?? '',
    remitenteCP:                   envio.remitenteCodigoPostal     ?? '',

    destinatarioNombre:            envio.destinatarioNombre        ?? '',
    destinatarioDireccion:         destDir,
    destinatarioReferencia:        destRef,
    destinatarioCiudad:            envio.destinatarioCiudad        ?? '',
    destinatarioDepto:             envio.destinatarioDepartamento  ?? '',
    destinatarioTel:               envio.destinatarioTelefono      ?? '',
    destinatarioCP:                envio.destinatarioCodigoPostal  ?? '',

    codigoOperativo:               servicio.codigo,

    pesoFisico:                    fmtKg(envio.pesoFisicoKg),
    pesoVolumetrico:               fmtKg(envio.pesoVolumetricoKg),
    pesoFacturado:                 fmtKg(envio.pesoTarificadoKg),

    valorDeclarado:                fmtCop(envio.valorDeclarado),
    valorFlete:                    fmtCop(envio.valorServicio),
    costoManejo:                   fmtCop(costoExtra),
    valorTotal:                    fmtCop(envio.valorTotal),

    observaciones:                 envio.observaciones ?? '',
    diceContener:                  envio.contenido     ?? '',

    barcodeText1:                  `*${tracking.slice(0, 10)}`,
    barcodeText2:                  `${tracking.slice(10)}*`,
    fechaEntrega:                  entrega,
    codigoGuia:                    guia,
    fechaPlaceholder1:             admision,
    fechaPlaceholder2:             entrega,
    codigoOperativoBajo:           sucursal.codigo,
    barcodeLineal:                 tracking,

    lateral_destinatarioNombre:    envio.destinatarioNombre        ?? '',
    lateral_destinatarioDireccion: envio.destinatarioDireccion     ?? '',
    lateral_destinatarioCiudad:    [envio.destinatarioCiudad, envio.destinatarioDepartamento]
                                     .filter(Boolean).join(' - '),
    lateral_destinatarioDepto:     envio.destinatarioDepartamento  ?? '',
    lateral_destinatarioCP:        envio.destinatarioCodigoPostal  ?? '',
    lateral_fechaAdmision:         admision,

    lateral_remitenteNombre:       envio.remitenteNombre           ?? '',
    lateral_remitenteDireccion:    envio.remitenteDireccion        ?? '',
    lateral_remitenteCiudad:       envio.remitenteCiudad           ?? '',
    lateral_remitenteDepto:        envio.remitenteDepartamento     ?? '',
    lateral_remitenteCP:           envio.remitenteCodigoPostal     ?? '',
    // El slot admite 18 caracteres y los nombres de servicio pasan de 38, así que
    // el código es lo único que cabe entero sin volverse ambiguo.
    lateral_envio:                 servicio.codigo,

    pieLegal1:                     PIE1,
    pieLegal2:                     PIE2,
    pieLegal3:                     PIE3,

    lateral_derecho_centro:        truncarPalabra(sucursal.nombre, CAMPOS.lateral_derecho_centro.max),
    lateral_derecho_codigo:        codigoCorto(sucursal.codigo),
  };
}

// ── Motor de inyección SVG (sin DOM, puro string) ─────────────────────────────

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectField(svg: string, tspanId: string, value: string, max: number): string {
  const truncated = value.length > max ? value.slice(0, max) : value;
  const safe = xmlEscape(truncated);

  // Locate id="tspanId" → walk back to <tspan → find closing > → replace content → </tspan>
  const idMarker = `id="${tspanId}"`;
  const idPos = svg.indexOf(idMarker);
  if (idPos === -1) return svg;

  const tagStart = svg.lastIndexOf('<tspan', idPos);
  if (tagStart === -1) return svg;

  const tagEnd = svg.indexOf('>', idPos) + 1;
  if (tagEnd === 0) return svg;

  const closeTag = svg.indexOf('</tspan>', tagEnd);
  if (closeTag === -1) return svg;

  return svg.slice(0, tagEnd) + safe + svg.slice(closeTag);
}

// ── Cache de plantilla ────────────────────────────────────────────────────────

let _template: string | null = null;

async function loadTemplate(): Promise<string> {
  if (!_template) {
    const raw = await fs.promises.readFile(TEMPLATE_PATH, 'utf-8');
    // La plantilla trae un <script> con datos de demo que se auto-ejecuta al
    // abrirla en un browser; puppeteer sí lo corre y pisa lo ya inyectado.
    _template = raw.replace(/<script[\s\S]*?<\/script>/g, '');
  }
  return _template;
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function renderGuiaSvg(data: GuiaData): Promise<Buffer> {
  let svg = await loadTemplate();

  for (const [campo, { id, max }] of Object.entries(CAMPOS) as [keyof GuiaData, { id: string; max: number }][]) {
    svg = injectField(svg, id, data[campo] ?? '', max);
  }

  return Buffer.from(svg, 'utf-8');
}

export async function generarGuiaEnvioSvg(
  envio:         EnvioEntity,
  servicio:      ServicioGuiaInfo,
  sucursal:      SucursalGuiaInfo,
  fechaEntrega?: Date,
): Promise<Buffer> {
  const data = buildGuiaData(envio, servicio, sucursal, fechaEntrega);
  return renderGuiaSvg(data);
}
