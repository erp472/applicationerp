import puppeteer from 'puppeteer-core'

const J = (o: any) => JSON.stringify(o)

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })

  // ── A) race de fuentes: medir NADA MAS montar, sin re-render ─────────────
  const p1 = await browser.newPage()
  await p1.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 })
  await p1.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'domcontentloaded' })
  await p1.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click() })
  const race = await p1.evaluate(async () => {
    ;(globalThis as any).__name = (globalThis as any).__name ?? ((f: any) => f)
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    await wait(50)
    const g = () => {
      const svg = document.querySelector('.guia-svg-root svg')
      if (!svg) return 'no svg'
      const e = svg.querySelector('#tspan_pieLegal1')!
      return { tl: e.getAttribute('textLength'), len: +(e as any).getComputedTextLength().toFixed(2), maxw: e.getAttribute('data-maxw') }
    }
    const t0 = g()
    await (document as any).fonts.ready
    await wait(500)
    const t1 = g()
    return { alMontar: t0, trasFonts: t1, status: (document as any).fonts.status }
  })
  console.log('=== A) condensado data-maxw vs carga de fuentes ===')
  console.log(J(race))
  await p1.close()

  // ── B) clip del numero de guia grande ───────────────────────────────────
  const p2 = await browser.newPage()
  await p2.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 3 })
  await p2.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })
  await p2.evaluate(() => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click() })
  await new Promise((r) => setTimeout(r, 400))
  console.log('\n=== B) clipPath738 = x[400.688..593.276] y[742.406..776.506] ===')
  for (const mock of ['nacional', 'corto', 'intl']) {
    await p2.evaluate((m) => { ([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === m) as HTMLButtonElement)?.click() }, mock)
    await new Promise((r) => setTimeout(r, 500))
    const r = await p2.evaluate(() => {
      ;(globalThis as any).__name = (globalThis as any).__name ?? ((f: any) => f)
      const svg = document.querySelector('.guia-svg-root svg')!
      const root = svg.getBoundingClientRect()
      const scale = root.width / 816
      const info = (id: string) => {
        const e = svg.querySelector('#' + CSS.escape(id))!
        const b = e.getBoundingClientRect()
        return { txt: e.textContent, xIni: +((b.left - root.left) / scale).toFixed(1), xFin: +((b.right - root.left) / scale).toFixed(1) }
      }
      return { t1: info('tspan740'), t2: info('tspan744'), cg: info('tspan1238') }
    })
    const clipR = 593.276 - 400.688 + 400.688 // 593.276
    const over1 = r.t1.xFin > 593.3 ? `  << barcodeText1 RECORTADO ${(r.t1.xFin - 593.276).toFixed(1)}u` : ''
    console.log(`  ${mock.padEnd(9)} barcodeText1=${J(r.t1)}${over1}`)
    console.log(`            barcodeText2=${J(r.t2)}  (baseline y=714.95, clip empieza en 742.4 -> invisible si no vacio)`)
    console.log(`            codigoGuia  =${J(r.cg)}`)
    const el = await p2.$('.guia-svg-root'); const box = await el!.boundingBox()
    await p2.screenshot({ path: `/tmp/tr_${mock}.png`, clip: { x: box!.x + box!.width * 0.45, y: box!.y, width: box!.width * 0.55, height: box!.height * 0.32 } })
  }
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
