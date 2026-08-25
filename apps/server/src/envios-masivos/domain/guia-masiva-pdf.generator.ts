import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export interface GuiaPdfItem {
  loteId:            number;
  fila:              number;
  numeroGuia:        string;         // RA18519403  (legible)
  codigoTracking:    string | null;  // RA185194038CO (código de barras)
  remitente: {
    nombre:    string;
    documento: string | null;
    direccion: string | null;
    ciudad:    string | null;
    telefono:  string | null;
    cp:        string | null;
  };
  destinatario: {
    nombre:    string;
    documento: string | null;
    direccion: string | null;
    ciudad:    string | null;
    pais:      string;
    telefono:  string | null;
    cp:        string | null;
  };
  servicio:           string;
  pesoFisicoKg:       number;
  pesoTarificadoKg:   number;
  valorServicio:      number;
  valorCertificacion: number;
  valorTotal:         number;
  contenido:          string | null;
  observaciones:      string | null;
  fecha:              Date;
}

// ── Colores ──────────────────────────────────────────────────────────────────

const C = {
  blue:      rgb(0.07, 0.27, 0.60),
  blueSoft:  rgb(0.87, 0.91, 0.97),
  blueText:  rgb(0.70, 0.82, 0.98),
  white:     rgb(1, 1, 1),
  dark:      rgb(0.12, 0.12, 0.12),
  gray:      rgb(0.50, 0.50, 0.50),
  grayLight: rgb(0.75, 0.75, 0.75),
  divider:   rgb(0.82, 0.82, 0.82),
  red:       rgb(0.72, 0.10, 0.10),
};

// ── Utilidades ────────────────────────────────────────────────────────────────

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});
const formatCop = (v: number) => COP.format(v);
const grams     = (kg: number) => kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(3)} kg`;

function cut(text: string, font: PDFFont, size: number, maxW: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
  return t + '…';
}

function line(page: PDFPage, x1: number, y: number, x2: number) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.4, color: C.divider });
}
function vline(page: PDFPage, x: number, y1: number, y2: number) {
  page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.4, color: C.divider });
}

function label(page: PDFPage, x: number, y: number, text: string, font: PDFFont) {
  page.drawText(text, { x, y, font, size: 6.5, color: C.gray });
  return y - 11;
}
function value(page: PDFPage, x: number, y: number, text: string, font: PDFFont, size = 9, maxW = 999) {
  const safe = cut(text, font, size, maxW);
  page.drawText(safe, { x, y, font, size, color: C.dark });
  return y - (size + 3.5);
}

// ── Generador principal ───────────────────────────────────────────────────────

export async function generarGuiasMasivasPdf(items: GuiaPdfItem[]): Promise<Buffer> {
  const doc    = await PDFDocument.create();
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const mono   = await doc.embedFont(StandardFonts.Courier);

  // A4 landscape
  const W = PageSizes.A4[1]; // 841.89
  const H = PageSizes.A4[0]; // 595.28
  const M = 24;              // margen lateral

  // Zonas verticales (y desde abajo)
  const FOOTER_H   = 72;
  const DATA_H     = 145;
  const BODY_H     = 268;
  const INFO_H     = 34;
  const HEADER_H   = 52;
  // total: 72+145+268+34+52 = 571 → +24 padding arriba = 595 ✓

  const FOOTER_TOP  = FOOTER_H;               // 72
  const DATA_TOP    = FOOTER_H + DATA_H;      // 217
  const BODY_TOP    = DATA_TOP + BODY_H;      // 485
  const INFO_TOP    = BODY_TOP + INFO_H;      // 519
  const HEADER_TOP  = H;                      // 595

  // Columnas
  const MID_X    = W * 0.44;   // ~370 — divisor entre remitente y destinatario
  const L_X      = M;
  const R_X      = MID_X + 18;
  const L_MAX    = MID_X - M - 8;
  const R_MAX    = W - M - R_X;

  for (const item of items) {
    const page = doc.addPage([W, H]);

    // ── HEADER ────────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: INFO_TOP, width: W, height: HEADER_H, color: C.blue });

    // Empresa izquierda
    page.drawText('4·72 SERVICIOS POSTALES NACIONALES', {
      x: M, y: INFO_TOP + 33, font: bold, size: 11, color: C.white,
    });
    page.drawText('NIT 900.062.917-9', {
      x: M, y: INFO_TOP + 19, font: normal, size: 8, color: C.blueText,
    });

    // Servicio centro
    const svcX = M + 280;
    page.drawText(item.servicio.toUpperCase(), {
      x: svcX, y: INFO_TOP + 35, font: bold, size: 9.5, color: C.white,
    });

    // Número de guía derecha — GRANDE
    const guiaDisplay = `*${item.numeroGuia}`;
    const guiaW = bold.widthOfTextAtSize(guiaDisplay, 24);
    page.drawText(guiaDisplay, {
      x: W - M - guiaW, y: INFO_TOP + 31, font: bold, size: 24, color: C.white,
    });
    if (item.codigoTracking) {
      const trackW = mono.widthOfTextAtSize(item.codigoTracking, 8.5);
      page.drawText(item.codigoTracking, {
        x: W - M - trackW, y: INFO_TOP + 16, font: mono, size: 8.5, color: C.blueText,
      });
    }

    // ── INFO BAR ──────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: BODY_TOP, width: W, height: INFO_H, color: C.blueSoft });
    page.drawText(`Lote #${item.loteId}`, {
      x: M, y: BODY_TOP + 13, font: bold, size: 8, color: C.blue,
    });
    page.drawText(`Fila ${item.fila}`, {
      x: M + 72, y: BODY_TOP + 13, font: normal, size: 8, color: C.gray,
    });
const fechaStr = item.fecha.toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    page.drawText(`Fecha: ${fechaStr}`, {
      x: W - M - 110, y: BODY_TOP + 13, font: normal, size: 8, color: C.gray,
    });

    line(page, 0, BODY_TOP, W);
    line(page, 0, DATA_TOP, W);
    vline(page, MID_X, DATA_TOP, BODY_TOP);
    line(page, 0, FOOTER_TOP, W);

    // ── REMITENTE (columna izquierda) ─────────────────────────────────────────
    let yL = BODY_TOP - 10;
    page.drawText('REMITENTE', { x: L_X, y: yL, font: bold, size: 7, color: C.gray });
    yL -= 3;
    page.drawLine({ start: { x: L_X, y: yL }, end: { x: MID_X - 8, y: yL }, thickness: 0.3, color: C.grayLight });
    yL -= 14;

    page.drawText(cut(item.remitente.nombre, bold, 11, L_MAX), {
      x: L_X, y: yL, font: bold, size: 11, color: C.dark,
    });
    yL -= 15;

    if (item.remitente.documento || item.remitente.telefono) {
      const docTel = [
        item.remitente.documento ? `Doc: ${item.remitente.documento}` : null,
        item.remitente.telefono  ? `Tel: ${item.remitente.telefono}`  : null,
      ].filter(Boolean).join('   ');
      page.drawText(cut(docTel, normal, 8.5, L_MAX), { x: L_X, y: yL, font: normal, size: 8.5, color: C.dark });
      yL -= 13;
    }
    if (item.remitente.direccion) {
      page.drawText(cut(item.remitente.direccion, normal, 8.5, L_MAX), {
        x: L_X, y: yL, font: normal, size: 8.5, color: C.dark,
      });
      yL -= 13;
    }
    if (item.remitente.ciudad) {
      const cpPart = item.remitente.cp ? `   CP: ${item.remitente.cp}` : '';
      page.drawText(cut(`${item.remitente.ciudad}${cpPart}`, normal, 8.5, L_MAX), {
        x: L_X, y: yL, font: normal, size: 8.5, color: C.dark,
      });
    }

    // ── DESTINATARIO (columna derecha) ────────────────────────────────────────
    let yR = BODY_TOP - 10;
    page.drawText('DESTINATARIO', { x: R_X, y: yR, font: bold, size: 7, color: C.blue });
    yR -= 3;
    page.drawLine({ start: { x: R_X, y: yR }, end: { x: W - M, y: yR }, thickness: 0.5, color: C.blue });
    yR -= 16;

    page.drawText(cut(item.destinatario.nombre, bold, 14, R_MAX), {
      x: R_X, y: yR, font: bold, size: 14, color: C.dark,
    });
    yR -= 19;

    if (item.destinatario.documento || item.destinatario.telefono) {
      const docTel = [
        item.destinatario.documento ? `Doc: ${item.destinatario.documento}` : null,
        item.destinatario.telefono  ? `Tel: ${item.destinatario.telefono}`  : null,
      ].filter(Boolean).join('   ');
      page.drawText(cut(docTel, normal, 9, R_MAX), { x: R_X, y: yR, font: normal, size: 9, color: C.dark });
      yR -= 14;
    }
    if (item.destinatario.direccion) {
      page.drawText(cut(item.destinatario.direccion, normal, 9.5, R_MAX), {
        x: R_X, y: yR, font: normal, size: 9.5, color: C.dark,
      });
      yR -= 14;
    }
    if (item.destinatario.ciudad) {
      const paisPart = item.destinatario.pais !== 'CO' ? `  (${item.destinatario.pais})` : '';
      const cpPart   = item.destinatario.cp ? `   CP: ${item.destinatario.cp}` : '';
      page.drawText(cut(`${item.destinatario.ciudad}${paisPart}${cpPart}`, bold, 9.5, R_MAX), {
        x: R_X, y: yR, font: bold, size: 9.5, color: C.dark,
      });
    }

    // ── SECCIÓN DE DATOS (entre dividers DATA_TOP..BODY_TOP) ─────────────────
    // Columna izquierda: pesos y valores
    const DY = DATA_TOP - 12;
    page.drawText('DATOS DEL ENVÍO', { x: L_X, y: DY, font: bold, size: 7, color: C.gray });

    const rows: Array<[string, string, boolean]> = [
      ['Peso Físico',    grams(item.pesoFisicoKg),                            false],
      ['Peso Tarificado',grams(item.pesoTarificadoKg),                        false],
      ['Valor Servicio', formatCop(item.valorServicio),                        false],
      ['Certificación',  item.valorCertificacion > 0 ? formatCop(item.valorCertificacion) : '—', false],
      ['VALOR TOTAL',    formatCop(item.valorTotal),                           true],
    ];

    let dy = DY - 14;
    for (const [lbl, val, isBold] of rows) {
      const f = isBold ? bold : normal;
      const sz = isBold ? 9.5 : 8.5;
      page.drawText(lbl + ':', { x: L_X, y: dy, font: normal, size: 8, color: C.gray });
      page.drawText(val, { x: L_X + 110, y: dy, font: f, size: sz, color: isBold ? C.blue : C.dark });
      dy -= (isBold ? 14 : 13);
    }

    // Columna derecha: contenido y observaciones
    vline(page, MID_X, FOOTER_TOP, DATA_TOP);
    let dr = DATA_TOP - 12;
    page.drawText('DICE CONTENER', { x: R_X, y: dr, font: bold, size: 7, color: C.gray });
    dr -= 13;
    page.drawText(
      cut(item.contenido ?? '—', normal, 8.5, R_MAX),
      { x: R_X, y: dr, font: normal, size: 8.5, color: C.dark },
    );
    dr -= 22;
    page.drawText('OBSERVACIONES', { x: R_X, y: dr, font: bold, size: 7, color: C.gray });
    dr -= 13;
    if (item.observaciones) {
      page.drawText(cut(item.observaciones, normal, 8.5, R_MAX), {
        x: R_X, y: dr, font: normal, size: 8.5, color: C.dark,
      });
    }

    // ── FOOTER — código de tracking ───────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_TOP, color: C.blueSoft });
    line(page, 0, FOOTER_TOP, W);

    if (item.codigoTracking) {
      const tracking = item.codigoTracking;
      const tSize = 20;
      const tW    = mono.widthOfTextAtSize(tracking, tSize);
      page.drawText(tracking, {
        x: (W - tW) / 2, y: FOOTER_TOP - 26, font: mono, size: tSize, color: C.blue,
      });
      // barras decorativas simétricas a los lados del código
      const barH = 22;
      const barX1 = (W - tW) / 2 - 18;
      const barX2 = (W + tW) / 2 + 6;
      for (let b = 0; b < 5; b++) {
        const bw = b % 2 === 0 ? 3 : 1.5;
        page.drawRectangle({ x: barX1 - b * 5, y: FOOTER_TOP - 30, width: bw, height: barH, color: C.blue });
        page.drawRectangle({ x: barX2 + b * 5, y: FOOTER_TOP - 30, width: bw, height: barH, color: C.blue });
      }
    }

    // Pie de página
    const footLabel = `${item.servicio}  ·  Lote ${item.loteId}  ·  Fila ${item.fila}`;
    page.drawText(footLabel, { x: M, y: 8, font: normal, size: 7.5, color: C.gray });
    page.drawText('4-72 SERVICIOS POSTALES NACIONALES', {
      x: W - M - bold.widthOfTextAtSize('4-72 SERVICIOS POSTALES NACIONALES', 7.5),
      y: 8, font: bold, size: 7.5, color: C.blue,
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
