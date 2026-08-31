import puppeteer from 'puppeteer-core'

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 })
  await page.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })
  await page.evaluate(() => {
    ;([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  // zoom a 100%
  await page.evaluate(() => {
    const plus = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '+') as HTMLButtonElement
    plus?.click(); plus?.click()
  })
  await new Promise((r) => setTimeout(r, 300))

  for (const mock of ['nacional', 'corto', 'intl']) {
    await page.evaluate((m) => {
      ;([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === m) as HTMLButtonElement)?.click()
    }, mock)
    await new Promise((r) => setTimeout(r, 600))

    const overlaps = await page.evaluate(() => {
      const svg = document.querySelector('.guia-svg-root svg')!
      const nodes = [...svg.querySelectorAll('tspan')]
        .filter((t) => (t.textContent ?? '').trim().length > 0)
        .map((t) => { const r = t.getBoundingClientRect(); return { id: t.id, txt: (t.textContent ?? '').slice(0, 28), l: r.left, r: r.right, t: r.top, b: r.bottom } })
        .filter((n) => n.r > n.l && n.b > n.t)
      const hits: string[] = []
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l)
        const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t)
        if (ox > 1.5 && oy > 1.5) hits.push(`${a.id}("${a.txt}") x ${b.id}("${b.txt}")  overlap ${ox.toFixed(1)}x${oy.toFixed(1)}px`)
      }
      const sr = svg.getBoundingClientRect()
      const outOfBounds = nodes.filter((n) => n.r > sr.right + 1 || n.l < sr.left - 1).map((n) => `${n.id}("${n.txt}") right=${(n.r - sr.right).toFixed(1)}px fuera`)
      return { hits, outOfBounds }
    })
    console.log(`\n=== ${mock}: solapes de texto (${overlaps.hits.length}) ===`)
    overlaps.hits.forEach((h) => console.log('  ' + h))
    console.log(`  fuera del viewBox (${overlaps.outOfBounds.length}):`, overlaps.outOfBounds)

    const el = await page.$('.guia-svg-root')
    await el!.screenshot({ path: `/tmp/guia_${mock}.png` })
  }
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
