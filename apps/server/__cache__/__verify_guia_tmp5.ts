import puppeteer from 'puppeteer-core'

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 3 })
  await page.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })
  await page.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 500))

  // Diagnostico del race de fuentes / re-medicion
  const race = await page.evaluate(async () => {
    ;(globalThis as any).__name = (globalThis as any).__name ?? ((f: any) => f)
    const read = () => {
      const svg = document.querySelector('.guia-svg-root svg')!
      const sr = svg.getBoundingClientRect()
      const g = (id: string) => {
        const e = svg.querySelector('#' + CSS.escape(id))!
        const r = e.getBoundingClientRect()
        return { tl: e.getAttribute('textLength'), overflowPx: +(r.right - sr.right).toFixed(1), len: +(e as any).getComputedTextLength().toFixed(2) }
      }
      return { pie1: g('tspan_pieLegal1'), pie2: g('tspan_pieLegal2'), pie3: g('tspan_pieLegal3'), t744: g('tspan744') }
    }
    const antes = read()
    await (document as any).fonts.ready
    await new Promise((r) => setTimeout(r, 300))
    const despues = read()
    return { antes, despues, fontStatus: (document as any).fonts.status,
      fontFamilyPie: getComputedStyle(document.querySelector('.guia-svg-root svg #tspan_pieLegal1')!).fontFamily }
  })
  console.log('=== race fuentes / condensado pieLegal ===')
  console.log(JSON.stringify(race, null, 1))

  // Posicion absoluta de barcodeText1 / barcodeText2 / codigoGuia
  const pos = await page.evaluate(() => {
    ;(globalThis as any).__name = (globalThis as any).__name ?? ((f: any) => f)
    const svg = document.querySelector('.guia-svg-root svg')!
    const sr = svg.getBoundingClientRect()
    const rel = (id: string) => {
      const e = svg.querySelector('#' + CSS.escape(id)) as SVGGraphicsElement | null
      if (!e) return null
      const r = e.getBoundingClientRect()
      return { txt: e.textContent, x: +(r.left - sr.left).toFixed(1), y: +(r.top - sr.top).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
    }
    return { barcodeText1: rel('tspan740'), barcodeText2: rel('tspan744'), codigoGuia: rel('tspan1238'), svgW: sr.width }
  })
  console.log('\n=== posiciones (rel al svg, px) ===')
  console.log(JSON.stringify(pos, null, 1))

  const el = await page.$('.guia-svg-root')
  const box = await el!.boundingBox()
  // crop esquina superior derecha
  await page.screenshot({ path: '/tmp/guia_topright.png', clip: { x: box!.x + box!.width * 0.5, y: box!.y, width: box!.width * 0.5, height: box!.height * 0.45 } })
  // crop pie
  await page.screenshot({ path: '/tmp/guia_pie.png', clip: { x: box!.x, y: box!.y + box!.height * 0.82, width: box!.width, height: box!.height * 0.18 } })
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
