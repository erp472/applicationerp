import puppeteer from 'puppeteer-core'
const J = (o: any) => JSON.stringify(o)

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })

  // A) race de fuentes en el primer montaje
  const p1 = await browser.newPage()
  await p1.setViewport({ width: 1600, height: 1000 })
  await p1.evaluateOnNewDocument(() => { (globalThis as any).__name = (f: any) => f })
  await p1.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })
  const race = await p1.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement
    b.click()
    const snaps: any[] = []
    const g = (label: string) => {
      const svg = document.querySelector('.guia-svg-root svg')
      if (!svg) return snaps.push({ label, s: 'no svg' })
      const e = svg.querySelector('#tspan_pieLegal1')!
      const sr = svg.getBoundingClientRect(), r = e.getBoundingClientRect()
      snaps.push({ label, tl: e.getAttribute('textLength'), len: +(e as any).getComputedTextLength().toFixed(1), maxw: e.getAttribute('data-maxw'), desborda: +(r.right - sr.right).toFixed(1) })
    }
    for (const ms of [0, 30, 100, 400, 1500]) { await wait(ms); g('t+' + ms) }
    return snaps
  })
  console.log('=== A) condensado pieLegal1 en el tiempo (primer montaje) ===')
  race.forEach((s: any) => console.log('  ' + J(s)))
  await p1.close()

  // B) watermark BORRADOR
  const p2 = await browser.newPage()
  await p2.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 })
  await p2.evaluateOnNewDocument(() => { (globalThis as any).__name = (f: any) => f })
  await p2.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })
  await p2.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 300))
  await p2.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === 'corto') as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 600))
  const wm = await p2.evaluate(() => {
    const svg = document.querySelector('.guia-svg-root svg')!
    const sr = svg.getBoundingClientRect()
    const w = svg.querySelector('[data-dyn="watermark"]') as SVGGraphicsElement | null
    const r = w?.getBoundingClientRect()
    const os = svg.querySelector('[data-dyn="237-736.552"]') as SVGGraphicsElement | null
    const orr = os?.getBoundingClientRect()
    return {
      viewBox: svg.getAttribute('viewBox'), svgAttrW: svg.getAttribute('width'), svgAttrH: svg.getAttribute('height'),
      svgBoxPx: [+sr.width.toFixed(1), +sr.height.toFixed(1)],
      watermark: r ? { l: +(r.left - sr.left).toFixed(1), t: +(r.top - sr.top).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), dentro: r.left >= sr.left - 1 && r.right <= sr.right + 1 && r.top >= sr.top - 1 && r.bottom <= sr.bottom + 1 } : null,
      ordenServicio: orr ? { txt: os!.textContent, l: +(orr.left - sr.left).toFixed(1), t: +(orr.top - sr.top).toFixed(1), dentro: orr.left >= sr.left - 1 && orr.right <= sr.right + 1 && orr.top >= sr.top - 1 && orr.bottom <= sr.bottom + 1 } : null,
    }
  })
  console.log('\n=== B) watermark BORRADOR + ordenServicio (mock corto) ===')
  console.log(J(wm))
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
