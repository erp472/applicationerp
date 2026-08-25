import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import type { EnvioEntity } from './venta.entity.js';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmt = (v: number) => COP.format(v);

export async function generarGuiaEnvioPdf(
  envio:         EnvioEntity,
  servicioNombre: string,
): Promise<Buffer> {
  const doc    = await PDFDocument.create();
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold);
  const normal = await doc.embedFont(StandardFonts.Helvetica);

  // A5 landscape (148 × 210 mm)
  const W = PageSizes.A5[1]; // 595.28
  const H = PageSizes.A5[0]; // 419.53
  const m = 28;

  const page = doc.addPage([W, H]);

  // ── Header bar ───────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 42, width: W, height: 42, color: rgb(0.12, 0.28, 0.60) });
  page.drawText('4-72 SERVICIOS POSTALES NACIONALES', {
    x: m, y: H - 27, font: bold, size: 11, color: rgb(1, 1, 1),
  });
  page.drawText('GUÍA POSTAL', {
    x: m, y: H - 38, font: normal, size: 7, color: rgb(0.75, 0.88, 1),
  });

  // ── Guide number (top right) ─────────────────────────────────────────────────
  page.drawText(envio.numeroGuia, {
    x: W - m - 150, y: H - 52, font: bold, size: 15, color: rgb(0.12, 0.28, 0.60),
  });
  page.drawText('Nº GUÍA', {
    x: W - m - 150, y: H - 61, font: normal, size: 6.5, color: rgb(0.55, 0.55, 0.55),
  });

  // ── Orden de servicio ────────────────────────────────────────────────────────
  page.drawText(`OS-${String(envio.id).padStart(6, '0')}`, {
    x: m, y: H - 58, font: normal, size: 7.5, color: rgb(0.4, 0.4, 0.4),
  });

  // ── Divider ──────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: m, y: H - 65 }, end: { x: W - m, y: H - 65 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

  // ── Remitente ────────────────────────────────────────────────────────────────
  let y = H - 82;
  page.drawText('REMITENTE', { x: m, y, font: bold, size: 7, color: rgb(0.4, 0.4, 0.4) });
  y -= 13;
  page.drawText(envio.remitenteNombre ?? '—', { x: m, y, font: bold, size: 9.5 });
  if (envio.remitenteDocumento) { y -= 11; page.drawText(`Doc: ${envio.remitenteDocumento}`, { x: m, y, font: normal, size: 8 }); }
  if (envio.remitenteDireccion) { y -= 11; page.drawText(envio.remitenteDireccion, { x: m, y, font: normal, size: 8, maxWidth: W / 2 - m - 10 }); }
  if (envio.remitenteCiudad)    { y -= 11; page.drawText(envio.remitenteCiudad, { x: m, y, font: normal, size: 8 }); }
  if (envio.remitenteTelefono)  { y -= 11; page.drawText(`Tel: ${envio.remitenteTelefono}`, { x: m, y, font: normal, size: 8 }); }
  if (envio.remitenteEmail)     { y -= 11; page.drawText(envio.remitenteEmail, { x: m, y, font: normal, size: 8 }); }

  // ── Destinatario ─────────────────────────────────────────────────────────────
  const colRight = W / 2 + 10;
  let yr = H - 82;
  page.drawText('DESTINATARIO', { x: colRight, y: yr, font: bold, size: 7, color: rgb(0.4, 0.4, 0.4) });
  yr -= 13;
  page.drawText(envio.destinatarioNombre ?? '—', { x: colRight, y: yr, font: bold, size: 9.5, maxWidth: W / 2 - m });
  if (envio.destinatarioDocumento) { yr -= 11; page.drawText(`Doc: ${envio.destinatarioDocumento}`, { x: colRight, y: yr, font: normal, size: 8 }); }
  if (envio.destinatarioDireccion) { yr -= 11; page.drawText(envio.destinatarioDireccion, { x: colRight, y: yr, font: normal, size: 8, maxWidth: W / 2 - m }); }
  if (envio.destinatarioCiudad)    { yr -= 11; page.drawText(`${envio.destinatarioCiudad} (${envio.destinatarioPais})`, { x: colRight, y: yr, font: normal, size: 8 }); }
  if (envio.destinatarioTelefono)  { yr -= 11; page.drawText(`Tel: ${envio.destinatarioTelefono}`, { x: colRight, y: yr, font: normal, size: 8 }); }
  if (envio.destinatarioEmail)     { yr -= 11; page.drawText(envio.destinatarioEmail, { x: colRight, y: yr, font: normal, size: 8 }); }

  // ── Vertical divider ─────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: W / 2, y: H - 72 }, end: { x: W / 2, y: m + 50 },
    thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
  });

  // ── Footer bar ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: 46, color: rgb(0.95, 0.97, 1) });
  page.drawLine({ start: { x: 0, y: 46 }, end: { x: W, y: 46 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

  const footItems: Array<[string, string]> = [
    ['SERVICIO', servicioNombre],
    ['PESO',     `${envio.pesoFisicoKg.toFixed(3)} kg`],
    ['VALOR',    fmt(envio.valorTotal)],
  ];
  if (envio.medioPago) {
    footItems.push(['PAGO', envio.medioPago.replace(/_/g, ' ')]);
  }
  const colW = (W - 2 * m) / footItems.length;
  footItems.forEach(([label, value], i) => {
    const fx = m + i * colW;
    page.drawText(label, { x: fx, y: 31, font: normal, size: 6.5, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(value, { x: fx, y: 14, font: bold, size: 9 });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
