import puppeteer from 'puppeteer-core'
const J = (o: any) => JSON.stringify(o)

async function main() {
  const browser = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 })
  await page.evaluateOnNewDocument(() => { (globalThis as any).__name = (f: any) => f })
  await page.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })

  const probe = async (label: string) => {
    const r = await page.evaluate(() => {
      const svg = document.querySelector('.guia-svg-root svg')
      if (!svg) return { s: 'no svg' }
      const e = svg.querySelector('#tspan_pieLegal1')!
      const sr = svg.getBoundingClientRect(), br = e.getBoundingClientRect()
      return {
        tl: e.getAttribute('textLength'), x: e.getAttribute('x'), la: e.getAttribute('lengthAdjust'),
        maxw: e.getAttribute('data-maxw'), ctl: +(e as any).getComputedTextLength().toFixed(1),
        font: getComputedStyle(e).fontFamily + ' / ' + getComputedStyle(e).fontSize,
        svgW: +sr.width.toFixed(1), boxW: +br.width.toFixed(1), overflow: +(br.right - sr.right).toFixed(1),
      }
    })
    console.log(' ', label, J(r))
  }

  await page.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 400)); await probe('tras SVG view')
  await page.evaluate(() => { const p = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '+') as HTMLButtonElement; p?.click(); p?.click() })
  await new Promise((r) => setTimeout(r, 300)); await probe('tras zoom +2 (1.05)')
  await page.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === 'nacional') as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 600)); await probe('tras click nacional (no-op)')
  await page.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === 'corto') as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 600)); await probe('tras click corto')
  await page.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === 'nacional') as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 600)); await probe('vuelta a nacional')
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
