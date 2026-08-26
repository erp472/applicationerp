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
  remitenteNit:                  string;
  remitenteCiudad:               string;
  remitenteDepto:                string;
  remitenteTelefono:             string;
  remitenteCP:                   string;
  destinatarioNombre:            string;
  destinatarioDireccion:         string;
  destinatarioCiudad:            string;
  destinatarioDepto:             string;
  destinatarioTel:               string;
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
  centroOperativo:               { id: 'tspan80',                             max: 18  },
  fechaAdmision:                 { id: 'tspan106',                            max: 14  },
  fechaApproxEntrega:            { id: 'tspan146',                            max: 14  },
  remitenteNombre:               { id: 'tspan332',                            max: 45  },
  remitenteDireccion:            { id: 'tspan348',                            max: 48  },
  remitenteNit:                  { id: 'tspan364',                            max: 20  },
  remitenteCiudad:               { id: 'tspan392',                            max: 28  },
  remitenteDepto:                { id: 'tspan408',                            max: 25  },
  remitenteTelefono:             { id: 'tspan424',                            max: 15  },
  remitenteCP:                   { id: 'tspan440',                            max: 10  },
  destinatarioNombre:            { id: 'tspan456',                            max: 45  },
  destinatarioDireccion:         { id: 'tspan472',                            max: 48  },
  destinatarioCiudad:            { id: 'tspan488',                            max: 28  },
  destinatarioDepto:             { id: 'tspan504',                            max: 25  },
  destinatarioTel:               { id: 'tspan520',                            max: 15  },
  codigoOperativo:               { id: 'tspan544',                            max: 15  },
  pesoFisico:                    { id: 'tspan576',                            max: 8   },
  pesoVolumetrico:               { id: 'tspan592',                            max: 8   },
  pesoFacturado:                 { id: 'tspan608',                            max: 8   },
  valorDeclarado:                { id: 'tspan624',                            max: 12  },
  valorFlete:                    { id: 'tspan640',                            max: 12  },
  costoManejo:                   { id: 'tspan656',                            max: 12  },
  valorTotal:                    { id: 'tspan672',                            max: 12  },
  observaciones:                 { id: 'tspan704',                            max: 30  },
  diceContener:                  { id: 'tspan_diceContener',                  max: 54  },
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
  lateral_derecho_centro:        { id: 'tspan_lateral_derecho_centro',        max: 15  },
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

// ── Mapper EnvioEntity → GuiaData ────────────────────────────────────────────

export function buildGuiaData(
  envio:          EnvioEntity,
  servicioNombre: string,
  sucursal:       SucursalGuiaInfo,
  fechaEntrega?:  Date,
): GuiaData {
  const admision  = fmtDate(envio.createdAt);
  const entrega   = fechaEntrega ? fmtDate(fechaEntrega) : '';
  const guia      = envio.numeroGuia;
  const costoExtra = (envio.valorEstampillas ?? 0)
                   + (envio.valorSeguro ?? 0)
                   + (envio.valorCertificacion ?? 0);

  return {
    centroOperativo:               sucursal.nombre,
    fechaAdmision:                 admision,
    fechaApproxEntrega:            entrega,

    remitenteNombre:               envio.remitenteNombre          ?? '',
    remitenteDireccion:            envio.remitenteDireccion        ?? '',
    remitenteNit:                  envio.remitenteDocumento        ?? '',
    remitenteCiudad:               envio.remitenteCiudad           ?? '',
    remitenteDepto:                envio.remitenteDepartamento     ?? '',
    remitenteTelefono:             envio.remitenteTelefono         ?? '',
    remitenteCP:                   envio.remitenteCodigoPostal     ?? '',

    destinatarioNombre:            envio.destinatarioNombre        ?? '',
    destinatarioDireccion:         envio.destinatarioDireccion     ?? '',
    destinatarioCiudad:            envio.destinatarioCiudad        ?? '',
    destinatarioDepto:             envio.destinatarioDepartamento  ?? '',
    destinatarioTel:               envio.destinatarioTelefono      ?? '',

    codigoOperativo:               servicioNombre,

    pesoFisico:                    fmtKg(envio.pesoFisicoKg),
    pesoVolumetrico:               fmtKg(envio.pesoVolumetricoKg),
    pesoFacturado:                 fmtKg(envio.pesoTarificadoKg),

    valorDeclarado:                fmtCop(envio.valorDeclarado),
    valorFlete:                    fmtCop(envio.valorServicio),
    costoManejo:                   fmtCop(costoExtra),
    valorTotal:                    fmtCop(envio.valorTotal),

    observaciones:                 '',
    diceContener:                  '',

    barcodeText1:                  `*${guia.slice(0, 10)}`,
    barcodeText2:                  `${guia.slice(10)}*`,
    fechaEntrega:                  entrega,
    codigoGuia:                    guia,
    fechaPlaceholder1:             admision,
    fechaPlaceholder2:             entrega,
    codigoOperativoBajo:           sucursal.codigo,
    barcodeLineal:                 guia,

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
    lateral_envio:                 servicioNombre,

    pieLegal1:                     PIE1,
    pieLegal2:                     PIE2,
    pieLegal3:                     PIE3,

    lateral_derecho_centro:        sucursal.nombre,
    lateral_derecho_codigo:        sucursal.codigo,
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
    _template = await fs.promises.readFile(TEMPLATE_PATH, 'utf-8');
  }
  return _template;
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function renderGuiaSvg(data: GuiaData): Promise<Buffer> {
  let svg = await loadTemplate();

  for (const [campo, { id, max }] of Object.entries(CAMPOS) as [keyof GuiaData, { id: string; max: number }][]) {
    svg = injectField(svg, id, data[campo] ?? '', max);
  }

  // El auto-render del SVG llama a setGuia(GUIA_TEST) al abrirse en el browser;
  // como el dato ya está inyectado en el markup, lo neutralizamos.
  svg = svg.replace(
    'function render() { setGuia(GUIA_TEST); }',
    'function render() { /* datos pre-inyectados por servidor */ }',
  );

  return Buffer.from(svg, 'utf-8');
}

export async function generarGuiaEnvioSvg(
  envio:          EnvioEntity,
  servicioNombre: string,
  sucursal:       SucursalGuiaInfo,
  fechaEntrega?:  Date,
): Promise<Buffer> {
  const data = buildGuiaData(envio, servicioNombre, sucursal, fechaEntrega);
  return renderGuiaSvg(data);
}
