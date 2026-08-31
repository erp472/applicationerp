import puppeteer from 'puppeteer-core'

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE error: ' + m.text()) })

  await page.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })

  // ── 1. buildGuiaData con payloads degradados ──────────────────────────────
  const degraded = await page.evaluate(async () => {
    const out: any = {}
    try {
      const m = await import(/* @vite-ignore */ '/src/lib/guia-data.ts')
      const cases: [string, any][] = [
        ['vacio {}', {}],
        ['solo numeroGuia', { numeroGuia: 'GU1' }],
        ['nested null', { remitente: null, destinatario: null, peso: null, valores: null }],
        ['fecha basura', { generadoEn: 'no-es-fecha', fechaEntregaEstimada: 'xx' }],
        ['centro numerico', { centroOperativo: 12345 }],
        ['nested vacios', { remitente: {}, destinatario: {}, peso: {}, valores: {} }],
      ]
      for (const [name, g] of cases) {
        try {
          const d = m.buildGuiaData(g)
          out[name] = { ok: true, sample: { tipo: d.tipoEtiqueta, centro: d.centroOperativo, fechaAdm: d.fechaAdmision, fechaEnt: d.fechaApproxEntrega, bt1: d.barcodeText1, bt2: d.barcodeText2, peso: d.pesoFisico, total: d.valorTotal, latCod: d.lateral_derecho_codigo } }
        } catch (e: any) { out[name] = { ok: false, err: e.message } }
      }
      // undefined / null guia
      for (const [name, g] of [['undefined', undefined], ['null', null]] as any[]) {
        try { m.buildGuiaData(g); out['guia ' + name] = { ok: true } }
        catch (e: any) { out['guia ' + name] = { ok: false, err: e.message } }
      }
    } catch (e: any) { out.__import = e.message }
    return out
  })
  console.log('===== 1. buildGuiaData degradado =====')
  for (const [k, v] of Object.entries(degraded)) console.log(' ', k, JSON.stringify(v))

  // ── 2. Render real de GuiaPostalSvg con payloads degradados / hostiles ────
  const rendered = await page.evaluate(async () => {
    const Rmod: any = await import(/* @vite-ignore */ '/node_modules/.vite/deps/react.js')
    const React: any = Rmod.createElement ? Rmod : Rmod.default
    const Dmod: any = await import(/* @vite-ignore */ '/node_modules/.vite/deps/react-dom_client.js')
    const createRoot: any = Dmod.createRoot ?? Dmod.default?.createRoot
    const mod = await import(/* @vite-ignore */ '/src/components/GuiaPostalSvg.tsx')
    const results: any[] = []
    const cases: [string, any][] = [
      ['borrador vacio', { estado: 'BORRADOR' }],
      ['solo remitente parcial', { estado: 'BORRADOR', remitente: { nombre: 'ACME' } }],
      ['XML hostil', {
        numeroGuia: 'A&B<C>D"E',
        codigoBarras: 'RA185194038CO',
        estado: 'ACTIVO',
        remitente: { nombre: 'Tom & Jerry <b>bold</b>', direccion: 'Cra "7" #1', ciudad: 'A&B' },
        destinatario: { nombre: '</tspan></text><rect width="9999" height="9999" fill="red"/>' },
        observaciones: '&amp; ya escapado',
        contenido: "O'Brien & sons",
        centroOperativo: 'X & Y',
      }],
    ]
    for (const [name, guia] of cases) {
      const div = document.createElement('div')
      document.body.appendChild(div)
      const root = createRoot(div)
      let err: string | null = null
      try {
        await new Promise<void>((res) => {
          root.render(React.createElement(mod.GuiaPostalSvg, { guia }))
          setTimeout(res, 400)
        })
      } catch (e: any) { err = e.message }
      const svg = div.querySelector('svg')
      const q = (id: string) => svg?.querySelector('#' + CSS.escape(id))?.textContent ?? null
      results.push({
        name, err,
        svgPresent: !!svg,
        tspanCount: svg ? svg.querySelectorAll('tspan').length : 0,
        rects9999: div.innerHTML.includes('9999') ? 'INJECTED-RECT-PRESENT' : 'none',
        remNombre: q('tspan332'),
        remDir: q('tspan348'),
        destNombre: q('tspan456'),
        codigoGuia: q('tspan1238'),
        observaciones: q('tspan704'),
        diceContener: q('tspan_diceContener'),
        centro: q('tspan80'),
        pesoFisico: q('tspan576'),
        watermark: svg?.querySelector('[data-dyn="watermark"]')?.textContent ?? null,
      })
      root.unmount(); div.remove()
    }
    return results
  })
  console.log('\n===== 2. Render GuiaPostalSvg degradado/hostil =====')
  for (const r of rendered) console.log(JSON.stringify(r, null, 1))

  // ── 3. Geometria: tipoEtiqueta intl vs vecino ────────────────────────────
  const geom = await page.evaluate(async () => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template'))
    b?.click()
    await new Promise((r) => setTimeout(r, 300))
    const out: any[] = []
    for (const mock of ['nacional', 'intl']) {
      const mb = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === mock)
      mb?.click()
      await new Promise((r) => setTimeout(r, 500))
      const svg = document.querySelector('.guia-svg-root svg')!
      const bb = (id: string) => {
        const e = svg.querySelector('#' + CSS.escape(id)) as SVGGraphicsElement | null
        if (!e) return null
        const r = e.getBoundingClientRect()
        return { l: +r.left.toFixed(1), r: +r.right.toFixed(1), t: +r.top.toFixed(1) }
      }
      out.push({
        mock,
        tipoEtiqueta: bb('tspan54'),
        vecino_tspan68_CentroOperativoLabel: bb('tspan68'),
        lateral_envio: bb('tspan_lateral_envio'),
        lateral_derecho_centro: bb('tspan_lateral_derecho_centro'),
        svgBox: (() => { const r = svg.getBoundingClientRect(); return { l: +r.left.toFixed(1), r: +r.right.toFixed(1) } })(),
      })
    }
    return out
  })
  console.log('\n===== 3. Geometria =====')
  for (const g of geom) console.log(JSON.stringify(g))

  console.log('\n===== ERRORES =====')
  console.log(errors.length ? errors.join('\n') : 'none')
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
