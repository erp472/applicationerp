import puppeteer from 'puppeteer-core';
import type { Page } from 'puppeteer-core';

// SVG template dimensions: 816 × 362 px (landscape — guía postal 4-72)
const PAGE_W = '816px';
const PAGE_H = '362px';

const CHROME_PATH =
  process.env['CHROME_PATH'] ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function wrapSvgs(svgs: string[]): string {
  const pages = svgs
    .map(s => `<div class="page">${s}</div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: white; }
  .page {
    width: ${PAGE_W};
    height: ${PAGE_H};
    page-break-after: always;
    overflow: hidden;
  }
  .page:last-child { page-break-after: avoid; }
  .page > svg { display: block; width: ${PAGE_W}; height: ${PAGE_H}; }
  @page { size: ${PAGE_W} ${PAGE_H}; margin: 0; }
</style>
</head>
<body>
${pages}
</body>
</html>`;
}

async function launchBrowser() {
  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
}

/**
 * Condensa los tspan marcados con data-maxw que desbordan su slot. Sólo se
 * puede resolver aquí porque hace falta medir el texto ya compuesto: la
 * plantilla no sabe cuánto ocupará un valor hasta que el navegador lo dibuja.
 */
async function ajustarDesbordes(page: Page): Promise<void> {
  await page.evaluate(() => {
    const condensar = (el: SVGTextContentElement, maxw: number) => {
      el.removeAttribute('textLength');
      if (el.textContent && el.getComputedTextLength() > maxw) {
        el.setAttribute('textLength', String(maxw));
        el.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    };

    // Reparto por renglones: data-wrap es el ancho del renglón y data-wrap-next
    // el id del siguiente. Va antes del condensado para que sólo se condense lo
    // que sigue desbordando después de repartir.
    for (const el of document.querySelectorAll<SVGTextContentElement>('[data-wrap-next]')) {
      const ancho = Number(el.getAttribute('data-wrap'));
      const texto = el.textContent ?? '';
      if (!ancho || !texto) continue;

      el.removeAttribute('textLength');
      if (el.getComputedTextLength() <= ancho) continue;

      let corte = -1;
      for (let i = texto.indexOf(' '); i > 0; i = texto.indexOf(' ', i + 1)) {
        if (el.getSubStringLength(0, i) > ancho) break;
        corte = i;
      }
      if (corte < 0) continue;

      el.textContent = texto.slice(0, corte);
      // Un PDF masivo mete N guías en el mismo documento, así que los ids de la
      // plantilla se repiten: hay que buscar dentro del <svg> de esta guía.
      const sig = el.ownerSVGElement?.querySelector<SVGTextContentElement>(
        `#${el.getAttribute('data-wrap-next')}`,
      );
      if (sig) sig.textContent = texto.slice(corte + 1);
    }

    for (const el of document.querySelectorAll<SVGTextContentElement>('[data-maxw]')) {
      const maxw = Number(el.getAttribute('data-maxw'));
      if (maxw) condensar(el, maxw);
    }
  });
}

export async function svgToPdf(svgBuffer: Buffer): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(wrapSvgs([svgBuffer.toString('utf-8')]), { waitUntil: 'load' });
    await ajustarDesbordes(page);
    const pdf = await page.pdf({ printBackground: true, width: PAGE_W, height: PAGE_H });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function svgsToPdf(svgBuffers: Buffer[]): Promise<Buffer> {
  if (svgBuffers.length === 0) throw new Error('No hay guías para generar');
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const svgs = svgBuffers.map(b => b.toString('utf-8'));
    await page.setContent(wrapSvgs(svgs), { waitUntil: 'load' });
    await ajustarDesbordes(page);
    const pdf = await page.pdf({ printBackground: true, width: PAGE_W, height: PAGE_H });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
