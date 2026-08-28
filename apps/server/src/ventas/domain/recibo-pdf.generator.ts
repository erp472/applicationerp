import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';

// ── Constantes de layout ───────────────────────────────────────────────────────

const PAGE_WIDTH  = 227;   // 80 mm en puntos
const MARGIN      = 8;
const CONTENT_W   = PAGE_WIDTH - MARGIN * 2;

// Tamaños de fuente
const FS_TINY   = 6.5;
const FS_SMALL  = 7.5;
const FS_BODY   = 8.5;
const FS_TITLE  = 10;
const FS_TOTAL  = 9;

// Alturas de fila
const LH_BODY   = 11;
const LH_ITEM   = 13;

// ── Formateadores ─────────────────────────────────────────────────────────────

const copFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});
function fmtCop(v: number)  { return copFmt.format(v).replace(/\s?/, ''); }
function fmtDate(d: Date)   {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtTime(d: Date)   {
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

const MEDIO_PAGO_LABEL: Record<string, string> = {
  efectivo:         'EFECTIVO',
  cheque:           'CHEQUE',
  tarjeta_debito:   'TARJETA DÉBITO',
  tarjeta_credito:  'TARJETA CRÉDITO',
  transferencia:    'TRANSFERENCIA',
  consignacion:     'CONSIGNACIÓN',
  preporteado:      'PREPORTEADO',
  mixto_preporteado:'MIXTO / PREPORTEADO',
  estampilla:       'ESTAMPILLA',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ReciboItem {
  descripcion:    string;
  cantidad:       number;
  precioUnitario: number;
  descuento:      number;
  subtotal:       number;
}

export interface ReciboData {
  ventaId:         number;
  fecha:           Date;
  sucursal:        { nombre: string; direccion: string | null; telefono: string | null };
  cajero:          { nombre: string };
  caja:            { nombre: string };
  cliente:         { nombre: string; tipoDoc: string; numeroDoc: string } | null;
  items:           ReciboItem[];
  subtotal:        number;
  descuento:       number;
  iva:             number;
  total:           number;
  medioPago:       string;
  efectivoRecibido?: number;
  cambio?:         number;
}

// ── Helpers de dibujo ─────────────────────────────────────────────────────────

interface DrawCtx {
  page:    PDFPage;
  font:    PDFFont;
  bold:    PDFFont;
  y:       number;
}

function drawText(
  ctx: DrawCtx, text: string, x: number, size: number,
  { bold = false, right = false, centerOf = 0 }: { bold?: boolean; right?: boolean; centerOf?: number } = {},
) {
  const f = bold ? ctx.bold : ctx.font;
  let tx = x;
  if (right) {
    tx = x - f.widthOfTextAtSize(text, size);
  } else if (centerOf > 0) {
    tx = x + (centerOf - f.widthOfTextAtSize(text, size)) / 2;
  }
  ctx.page.drawText(text, { x: tx, y: ctx.y, size, font: f, color: rgb(0, 0, 0) });
}

function drawLine(ctx: DrawCtx, dashed = false) {
  const x1 = MARGIN;
  const x2 = PAGE_WIDTH - MARGIN;
  if (dashed) {
    const dashW = 3; const gap = 2;
    for (let x = x1; x < x2; x += dashW + gap) {
      ctx.page.drawLine({ start: { x, y: ctx.y }, end: { x: Math.min(x + dashW, x2), y: ctx.y }, thickness: 0.4, color: rgb(0.6, 0.6, 0.6) });
    }
  } else {
    ctx.page.drawLine({ start: { x: x1, y: ctx.y }, end: { x: x2, y: ctx.y }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
  }
}

function nl(ctx: DrawCtx, h: number) { ctx.y -= h; }

// ── Cálculo de altura dinámica ─────────────────────────────────────────────────

function calcPageHeight(data: ReciboData): number {
  const headerBlock  = 8 + LH_BODY * 3 + 6 + LH_BODY * 2 + 6 + LH_BODY * 3 + 6;
  const clientBlock  = data.cliente ? LH_BODY * 2 + 6 : 0;
  const itemsBlock   = LH_BODY + 4 + data.items.length * LH_ITEM + 4;
  const totalsBlock  = LH_BODY * 4 + 6;
  const payBlock     = LH_BODY * (data.efectivoRecibido != null ? 3 : 1) + 6;
  const footerBlock  = LH_TINY * 4 + 10;
  return headerBlock + clientBlock + itemsBlock + totalsBlock + payBlock + footerBlock + 20;
}

const LH_TINY = FS_TINY + 2;

// ── API pública ───────────────────────────────────────────────────────────────

export async function generarReciboPdf(data: ReciboData): Promise<Buffer> {
  const doc  = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageHeight = calcPageHeight(data);
  const page = doc.addPage([PAGE_WIDTH, pageHeight]);

  const ctx: DrawCtx = { page, font, bold, y: pageHeight - MARGIN };

  // ── Encabezado empresa ────────────────────────────────────────────────────
  nl(ctx, 6);
  drawText(ctx, '4-72', MARGIN, FS_TITLE, { bold: true, centerOf: CONTENT_W });
  nl(ctx, LH_BODY + 2);
  drawText(ctx, 'SERVICIOS POSTALES NACIONALES S.A.S.', MARGIN, FS_TINY, { centerOf: CONTENT_W });
  nl(ctx, LH_TINY);
  drawText(ctx, 'NIT: 830.507.705-2', MARGIN, FS_TINY, { centerOf: CONTENT_W });
  nl(ctx, LH_TINY + 2);

  drawLine(ctx);
  nl(ctx, 4);

  // ── Info de la venta ──────────────────────────────────────────────────────
  drawText(ctx, `RECIBO No. ${String(data.ventaId).padStart(6, '0')}`, MARGIN, FS_BODY, { bold: true });
  nl(ctx, LH_BODY);
  drawText(ctx, `Fecha: ${fmtDate(data.fecha)}  ${fmtTime(data.fecha)}`, MARGIN, FS_SMALL);
  nl(ctx, LH_BODY + 2);

  drawLine(ctx, true);
  nl(ctx, 4);

  // ── Punto de venta ────────────────────────────────────────────────────────
  drawText(ctx, `Punto: ${data.sucursal.nombre}`, MARGIN, FS_SMALL);
  nl(ctx, LH_BODY);
  drawText(ctx, `Cajero: ${data.cajero.nombre}`, MARGIN, FS_SMALL);
  nl(ctx, LH_BODY);
  drawText(ctx, `Caja: ${data.caja.nombre}`, MARGIN, FS_SMALL);
  nl(ctx, LH_BODY + 2);

  drawLine(ctx, true);
  nl(ctx, 4);

  // ── Cliente ───────────────────────────────────────────────────────────────
  if (data.cliente) {
    drawText(ctx, `Cliente: ${data.cliente.nombre}`, MARGIN, FS_SMALL);
    nl(ctx, LH_BODY);
    drawText(ctx, `${data.cliente.tipoDoc}: ${data.cliente.numeroDoc}`, MARGIN, FS_SMALL);
    nl(ctx, LH_BODY + 2);

    drawLine(ctx, true);
    nl(ctx, 4);
  }

  // ── Cabecera de items ─────────────────────────────────────────────────────
  const colCant = MARGIN;
  const colDesc = MARGIN + 22;
  const colAmt  = PAGE_WIDTH - MARGIN;

  drawText(ctx, 'CANT', colCant, FS_TINY, { bold: true });
  drawText(ctx, 'DESCRIPCIÓN', colDesc, FS_TINY, { bold: true });
  drawText(ctx, 'TOTAL', colAmt, FS_TINY, { bold: true, right: true });
  nl(ctx, LH_TINY + 2);

  drawLine(ctx);
  nl(ctx, 3);

  // ── Items ─────────────────────────────────────────────────────────────────
  const maxDescW = CONTENT_W - 22 - 40;
  for (const item of data.items) {
    const desc = item.descripcion.length > 28 ? item.descripcion.slice(0, 27) + '…' : item.descripcion;
    drawText(ctx, String(item.cantidad), colCant, FS_SMALL);
    drawText(ctx, desc, colDesc, FS_SMALL);
    drawText(ctx, fmtCop(item.subtotal), colAmt, FS_SMALL, { right: true });
    nl(ctx, LH_ITEM);

    if (item.descuento > 0) {
      drawText(ctx, `  Dto: -${fmtCop(item.descuento)}`, colDesc, FS_TINY, { bold: false });
      nl(ctx, LH_TINY);
    }
  }

  nl(ctx, 1);
  drawLine(ctx);
  nl(ctx, 4);

  // ── Totales ───────────────────────────────────────────────────────────────
  const labelX = MARGIN;
  const amtX   = PAGE_WIDTH - MARGIN;

  drawText(ctx, 'Subtotal:', labelX, FS_SMALL);
  drawText(ctx, fmtCop(data.subtotal), amtX, FS_SMALL, { right: true });
  nl(ctx, LH_BODY);

  if (data.descuento > 0) {
    drawText(ctx, 'Descuento:', labelX, FS_SMALL);
    drawText(ctx, `-${fmtCop(data.descuento)}`, amtX, FS_SMALL, { right: true });
    nl(ctx, LH_BODY);
  }

  if (data.iva > 0) {
    drawText(ctx, 'IVA:', labelX, FS_SMALL);
    drawText(ctx, fmtCop(data.iva), amtX, FS_SMALL, { right: true });
    nl(ctx, LH_BODY);
  }

  drawText(ctx, 'TOTAL:', labelX, FS_TOTAL, { bold: true });
  drawText(ctx, fmtCop(data.total), amtX, FS_TOTAL, { bold: true, right: true });
  nl(ctx, LH_BODY + 2);

  drawLine(ctx);
  nl(ctx, 4);

  // ── Pago ──────────────────────────────────────────────────────────────────
  const medioPagoLabel = MEDIO_PAGO_LABEL[data.medioPago] ?? data.medioPago.toUpperCase();
  drawText(ctx, `Forma de pago: ${medioPagoLabel}`, labelX, FS_SMALL);
  nl(ctx, LH_BODY);

  if (data.efectivoRecibido != null) {
    drawText(ctx, 'Recibido:', labelX, FS_SMALL);
    drawText(ctx, fmtCop(data.efectivoRecibido), amtX, FS_SMALL, { right: true });
    nl(ctx, LH_BODY);
    drawText(ctx, 'Cambio:', labelX, FS_SMALL);
    drawText(ctx, fmtCop(data.cambio ?? 0), amtX, FS_SMALL, { right: true });
    nl(ctx, LH_BODY);
  }

  nl(ctx, 2);
  drawLine(ctx);
  nl(ctx, 6);

  // ── Pie ───────────────────────────────────────────────────────────────────
  drawText(ctx, 'Gracias por su preferencia.', MARGIN, FS_TINY, { centerOf: CONTENT_W });
  nl(ctx, LH_TINY);
  drawText(ctx, 'servicioalcliente@4-72.com.co', MARGIN, FS_TINY, { centerOf: CONTENT_W });
  nl(ctx, LH_TINY);
  drawText(ctx, 'Línea nacional: 01 8000 111 210', MARGIN, FS_TINY, { centerOf: CONTENT_W });
  nl(ctx, LH_TINY);
  if (data.sucursal.telefono) {
    drawText(ctx, `Tel: ${data.sucursal.telefono}`, MARGIN, FS_TINY, { centerOf: CONTENT_W });
    nl(ctx, LH_TINY);
  }

  return Buffer.from(await doc.save());
}
