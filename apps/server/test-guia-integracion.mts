/**
 * Prueba de integración de generación de guías.
 * Ejecutar desde apps/server/:
 *   DATABASE_URL="postgresql://postgres:123456@localhost:5432/pos_472?schema=public" \
 *   CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *   ./node_modules/.bin/tsx test-guia-integracion.mts
 */

import * as fs   from 'node:fs';
import * as path from 'node:path';
import * as url  from 'node:url';

import { PrismaClient }        from './generated/prisma/client.ts';
import { PrismaPg }            from './node_modules/@prisma/adapter-pg/dist/index.js';
import { generarGuiaEnvioSvg } from './src/ventas/domain/guia-svg.generator.ts';
import { svgToPdf, svgsToPdf } from './src/common/svg-to-pdf.ts';
import { generarGuiasMasivasPdf, type GuiaPdfItem } from './src/envios-masivos/domain/guia-masiva-pdf.generator.ts';

const OUT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '../../investigations/guias/output');
fs.mkdirSync(OUT, { recursive: true });

function ok(msg: string)   { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1; }
function section(t: string){ console.log(`\n── ${t} ──`); }

// ── Prisma ────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter } as any);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadEnvioEntity(idenvios: number) {
  const row = await prisma.envio.findUnique({
    where: { idenvios },
    select: {
      idenvios: true, numero_guiaenvios: true, tipoenvios: true,
      sucursales_idsucursales: true, created_atenvios: true,
      remitente_nombreenvios: true, remitente_documentoenvios: true,
      remitente_telefonoenvios: true, remitente_emailenvios: true,
      remitente_direccionenvios: true, remitente_ciudadenvios: true,
      remitente_departamentoenvios: true, remitente_codigo_postalenvios: true,
      destinatario_nombreenvios: true, destinatario_documentoenvios: true,
      destinatario_telefonoenvios: true, destinatario_emailenvios: true,
      destinatario_direccionenvios: true, destinatario_ciudadenvios: true,
      destinatario_departamentoenvios: true, destinatario_paisenvios: true,
      destinatario_codigo_postalenvios: true,
      peso_fisico_kgenvios: true, peso_volumetrico_kgenvios: true,
      peso_tarificado_kgenvios: true,
      alto_cmenvios: true, ancho_cmenvios: true, largo_cmenvios: true,
      valor_declaradoenvios: true, valor_servicioenvios: true,
      valor_estampillasenvios: true, valor_seguroenvios: true,
      valor_certificacionenvios: true, valor_totalenvios: true,
      medio_pagoenvios: true, estadoenvios: true,
      sucursal: { select: { codigosucursales: true, nombresucursales: true } },
      servicio: { select: { nombreservicios: true } },
    },
  });
  if (!row) throw new Error(`Envío ${idenvios} no encontrado`);

  // Mapeo mínimo a EnvioEntity (solo los campos que necesita buildGuiaData)
  return {
    id:                     row.idenvios,
    numeroGuia:             row.numero_guiaenvios,
    tipo:                   row.tipoenvios,
    sucursalId:             row.sucursales_idsucursales,
    createdAt:              row.created_atenvios,
    remitenteNombre:        row.remitente_nombreenvios,
    remitenteDocumento:     row.remitente_documentoenvios,
    remitenteTelefono:      row.remitente_telefonoenvios,
    remitenteEmail:         row.remitente_emailenvios,
    remitenteDireccion:     row.remitente_direccionenvios,
    remitenteCiudad:        row.remitente_ciudadenvios,
    remitenteDepartamento:  row.remitente_departamentoenvios,
    remitenteCodigoPostal:  row.remitente_codigo_postalenvios,
    destinatarioNombre:     row.destinatario_nombreenvios,
    destinatarioDocumento:  row.destinatario_documentoenvios,
    destinatarioTelefono:   row.destinatario_telefonoenvios,
    destinatarioEmail:      row.destinatario_emailenvios,
    destinatarioDireccion:  row.destinatario_direccionenvios,
    destinatarioCiudad:     row.destinatario_ciudadenvios,
    destinatarioDepartamento: row.destinatario_departamentoenvios,
    destinatarioCodigoPostal: row.destinatario_codigo_postalenvios,
    destinatarioPais:       row.destinatario_paisenvios,
    pesoFisicoKg:           Number(row.peso_fisico_kgenvios),
    pesoVolumetricoKg:      row.peso_volumetrico_kgenvios ? Number(row.peso_volumetrico_kgenvios) : null,
    pesoTarificadoKg:       Number(row.peso_tarificado_kgenvios),
    altoCm:  row.alto_cmenvios  ? Number(row.alto_cmenvios)  : null,
    anchoCm: row.ancho_cmenvios ? Number(row.ancho_cmenvios) : null,
    largoCm: row.largo_cmenvios ? Number(row.largo_cmenvios) : null,
    valorDeclarado:      row.valor_declaradoenvios  ? Number(row.valor_declaradoenvios)  : null,
    valorServicio:       Number(row.valor_servicioenvios),
    valorEstampillas:    Number(row.valor_estampillasenvios ?? 0),
    valorSeguro:         Number(row.valor_seguroenvios      ?? 0),
    valorCertificacion:  Number(row.valor_certificacionenvios ?? 0),
    valorTotal:          Number(row.valor_totalenvios),
    medioPago:           row.medio_pagoenvios as any,
    estado:              row.estadoenvios,
    _sucursal:           row.sucursal,
    _servicio:           row.servicio,
  } as any;
}

// ── TEST 1: Envío individual — SVG ────────────────────────────────────────────

async function testEnvioSvg(envioId: number) {
  section(`TEST 1 — Envío individual SVG (id=${envioId})`);
  const envio = await loadEnvioEntity(envioId);
  const sucursal = { codigo: envio._sucursal?.codigosucursales ?? '', nombre: envio._sucursal?.nombresucursales ?? '' };
  const servicioNombre = envio._servicio?.nombreservicios ?? envio.tipo;

  const svgBuffer = await generarGuiaEnvioSvg(envio, servicioNombre, sucursal);
  if (svgBuffer.length < 10_000) { fail(`SVG muy pequeño: ${svgBuffer.length} bytes`); return; }
  ok(`SVG generado — ${(svgBuffer.length / 1024).toFixed(0)} KB`);

  const outSvg = path.join(OUT, `envio-${envioId}.svg`);
  fs.writeFileSync(outSvg, svgBuffer);
  ok(`SVG guardado → ${path.relative(process.cwd(), outSvg)}`);

  // Verificar campos inyectados
  const svg = svgBuffer.toString('utf-8');
  const checks = [
    ['numeroGuia en SVG',      svg.includes(envio.numeroGuia)],
    ['sucursal en SVG',        sucursal.nombre.length === 0 || svg.includes(sucursal.nombre.slice(0, 5))],
    ['render() neutralizado',  svg.includes('datos pre-inyectados por servidor')],
  ];
  for (const [label, pass] of checks) {
    pass ? ok(label as string) : fail(label as string);
  }
}

// ── TEST 2: Envío individual — PDF (SVG → Chrome → PDF) ──────────────────────

async function testEnvioPdf(envioId: number) {
  section(`TEST 2 — Envío individual PDF (id=${envioId})`);
  const envio = await loadEnvioEntity(envioId);
  const sucursal = { codigo: envio._sucursal?.codigosucursales ?? '', nombre: envio._sucursal?.nombresucursales ?? '' };
  const servicioNombre = envio._servicio?.nombreservicios ?? envio.tipo;

  console.log('  → Generando SVG…');
  const svgBuffer = await generarGuiaEnvioSvg(envio, servicioNombre, sucursal);
  ok(`SVG generado — ${(svgBuffer.length / 1024).toFixed(0)} KB`);

  console.log('  → Convirtiendo a PDF via Chrome…');
  const pdfBuffer = await svgToPdf(svgBuffer);
  if (pdfBuffer.length < 5_000) { fail(`PDF muy pequeño: ${pdfBuffer.length} bytes`); return; }
  ok(`PDF generado — ${(pdfBuffer.length / 1024).toFixed(0)} KB`);

  const isPdf = pdfBuffer.slice(0, 4).toString() === '%PDF';
  isPdf ? ok('Encabezado %PDF correcto') : fail('El buffer no es un PDF válido');

  const outPdf = path.join(OUT, `envio-${envioId}.pdf`);
  fs.writeFileSync(outPdf, pdfBuffer);
  ok(`PDF guardado → ${path.relative(process.cwd(), outPdf)}`);
}

// ── TEST 3: Lote masivo — PDF multi-página ────────────────────────────────────

async function testLoteMasivo(loteId: number) {
  section(`TEST 3 — Lote masivo PDF (id=${loteId})`);

  const lote = await prisma.envioMasivo.findUnique({
    where:   { idenvios_masivos: loteId },
    include: {
      items:    { where: { envios_idenvios: { not: null } }, orderBy: { numero_filaenvios_masivos_items: 'asc' }, take: 3 },
      servicio: { select: { nombreservicios: true } },
      sucursal: { select: { codigosucursales: true, nombresucursales: true } },
    },
  });
  if (!lote) { fail(`Lote ${loteId} no encontrado`); return; }
  ok(`Lote encontrado — estado=${lote.estadoenvios_masivos}, items con guía: ${lote.items.length}`);

  if (lote.items.length === 0) { fail('No hay items confirmados en el lote'); return; }

  const envioIds = lote.items.map(i => i.envios_idenvios!);
  const envios = await prisma.envio.findMany({
    where: { idenvios: { in: envioIds } },
    select: {
      idenvios: true, numero_guiaenvios: true, numero_guia_fisicaenvios: true,
      peso_tarificado_kgenvios: true, valor_servicioenvios: true,
      valor_certificacionenvios: true, valor_totalenvios: true, created_atenvios: true,
    },
  });
  const envioMap = new Map(envios.map(e => [e.idenvios, e]));
  const nombreServicio = lote.servicio?.nombreservicios ?? 'Postal';
  const sucursal = { codigo: lote.sucursal?.codigosucursales ?? '', nombre: lote.sucursal?.nombresucursales ?? '' };

  const pdfItems: GuiaPdfItem[] = lote.items.map(item => {
    const envio = envioMap.get(item.envios_idenvios!)!;
    return {
      loteId,
      fila:           item.numero_filaenvios_masivos_items,
      numeroGuia:     envio.numero_guiaenvios,
      codigoTracking: envio.numero_guia_fisicaenvios,
      remitente: {
        nombre:    (item.remitente_nombreenvios_masivos_items  ?? lote.remitente_nombreenvios_masivos)!,
        documento: item.remitente_documentoenvios_masivos_items ?? lote.remitente_documentoenvios_masivos,
        direccion: item.remitente_direccionenvios_masivos_items ?? lote.remitente_direccionenvios_masivos,
        ciudad:    item.remitente_ciudadenvios_masivos_items    ?? lote.remitente_ciudadenvios_masivos,
        telefono:  item.remitente_telefonoenvios_masivos_items  ?? lote.remitente_telefonoenvios_masivos,
        cp:        item.remitente_cpenvios_masivos_items        ?? lote.remitente_cpenvios_masivos,
      },
      destinatario: {
        nombre:    item.destinatario_nombreenvios_masivos_items!,
        documento: item.destinatario_documentoenvios_masivos_items,
        direccion: item.destinatario_direccionenvios_masivos_items,
        ciudad:    item.destinatario_ciudadenvios_masivos_items,
        pais:      item.destinatario_paisenvios_masivos_items,
        telefono:  item.destinatario_telefonoenvios_masivos_items,
        cp:        item.destinatario_cpenvios_masivos_items,
      },
      servicio:           nombreServicio,
      pesoFisicoKg:       Number(item.peso_fisico_kgenvios_masivos_items),
      pesoTarificadoKg:   Number(envio.peso_tarificado_kgenvios),
      valorServicio:      Number(envio.valor_servicioenvios),
      valorCertificacion: Number(envio.valor_certificacionenvios),
      valorTotal:         Number(envio.valor_totalenvios),
      contenido:          item.contenidoenvios_masivos_items,
      observaciones:      item.observacionesenvios_masivos_items,
      fecha:              envio.created_atenvios,
    };
  });

  ok(`Items preparados: ${pdfItems.length}`);
  console.log('  → Generando PDF masivo via Chrome…');
  const pdfBuffer = await generarGuiasMasivasPdf(pdfItems, sucursal);

  if (pdfBuffer.length < 5_000) { fail(`PDF muy pequeño: ${pdfBuffer.length} bytes`); return; }
  ok(`PDF masivo generado — ${(pdfBuffer.length / 1024).toFixed(0)} KB`);

  const isPdf = pdfBuffer.slice(0, 4).toString() === '%PDF';
  isPdf ? ok('Encabezado %PDF correcto') : fail('El buffer no es un PDF válido');

  const outPdf = path.join(OUT, `lote-${loteId}.pdf`);
  fs.writeFileSync(outPdf, pdfBuffer);
  ok(`PDF guardado → ${path.relative(process.cwd(), outPdf)}`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

try {
  await testEnvioSvg(10);
  await testEnvioPdf(10);
  await testLoteMasivo(3);
  console.log('\n══ Pruebas completadas ══');
  console.log(`Archivos de salida en: ${path.relative(process.cwd(), OUT)}`);
} finally {
  await prisma.$disconnect();
}
