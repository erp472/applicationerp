import puppeteer from 'puppeteer-core';

// SVG template dimensions: 765 × 342 px (landscape — guía postal 4-72)
const PAGE_W = '765px';
const PAGE_H = '342px';

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

export async function svgToPdf(svgBuffer: Buffer): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(wrapSvgs([svgBuffer.toString('utf-8')]), { waitUntil: 'load' });
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
    const pdf = await page.pdf({ printBackground: true, width: PAGE_W, height: PAGE_H });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
