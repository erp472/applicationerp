import puppeteer from 'puppeteer-core'

const CAMPOS: Record<string, string> = {
  tipoEtiqueta: 'tspan54', centroOperativo: 'tspan80', fechaAdmision: 'tspan106',
  fechaApproxEntrega: 'tspan146', barcodeText1: 'tspan740', barcodeText2: 'tspan744',
  codigoGuia: 'tspan1238', remitenteNombre: 'tspan332', remitenteDireccion: 'tspan348',
  remitenteNit: 'tspan364', remitenteCiudad: 'tspan392', remitenteDepto: 'tspan408',
  remitenteTelefono: 'tspan424', remitenteCP: 'tspan440', destinatarioNombre: 'tspan456',
  destinatarioDireccion: 'tspan472', destinatarioCiudad: 'tspan488', destinatarioDepto: 'tspan504',
  destinatarioTel: 'tspan520', destinatarioCP: 'tspan_destinatarioCP', pesoFisico: 'tspan576',
  pesoVolumetrico: 'tspan592', pesoFacturado: 'tspan608', valorDeclarado: 'tspan624',
  valorFlete: 'tspan640', costoManejo: 'tspan656', valorTotal: 'tspan672',
  observaciones: 'tspan704', diceContener: 'tspan_diceContener', codigoOperativo: 'tspan544',
  codigoOperativoBajo: 'tspan1306', barcodeLineal: 'tspan1324', fechaEntrega: 'tspan812',
  fechaPlaceholder1: 'tspan1250', fechaPlaceholder2: 'tspan1262',
  lateral_destinatarioNombre: 'tspan_lateral_destinatarioNombre',
  lateral_destinatarioDireccion: 'tspan_lateral_destinatarioDireccion',
  lateral_destinatarioCiudad: 'tspan_lateral_destinatarioCiudad',
  lateral_destinatarioDepto: 'tspan_lateral_destinatarioDepto',
  lateral_destinatarioCP: 'tspan_lateral_destinatarioCP',
  lateral_fechaAdmision: 'tspan_lateral_fechaAdmision',
  lateral_remitenteNombre: 'tspan_lateral_remitenteNombre',
  lateral_remitenteDireccion: 'tspan_lateral_remitenteDireccion',
  lateral_remitenteCiudad: 'tspan_lateral_remitenteCiudad',
  lateral_remitenteDepto: 'tspan_lateral_remitenteDepto',
  lateral_remitenteCP: 'tspan_lateral_remitenteCP',
  lateral_envio: 'tspan_lateral_envio',
  lateral_derecho_codigo: 'tspan_lateral_derecho_codigo',
  lateral_derecho_centro: 'tspan_lateral_derecho_centro',
  pieLegal1: 'tspan_pieLegal1', pieLegal2: 'tspan_pieLegal2', pieLegal3: 'tspan_pieLegal3',
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`CONSOLE ${m.type()}: ${m.text()}`)
  })

  await page.goto('http://127.0.0.1:5212/guia-demo', { waitUntil: 'networkidle0' })

  // Switch to "SVG template" view
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template'))
    if (!b) return false
    b.click()
    return true
  })
  console.log('clicked SVG template button:', clicked)
  await new Promise((r) => setTimeout(r, 600))

  for (const mock of ['nacional', 'corto', 'intl']) {
    const before = errors.length
    const ok = await page.evaluate((m) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === m)
      if (!b) return false
      b.click()
      return true
    }, mock)
    await new Promise((r) => setTimeout(r, 700))

    const res = await page.evaluate((campos: Record<string, string>) => {
      const svg = document.querySelector('.guia-svg-root svg')
      if (!svg) return { fatal: 'NO SVG IN DOM' }
      const rows: any[] = []
      const withX: string[] = []
      const missing: string[] = []
      for (const [field, id] of Object.entries(campos)) {
        const el = svg.querySelector('#' + CSS.escape(id))
        if (!el) { missing.push(field + '/' + id); continue }
        if (el.hasAttribute('x')) withX.push(field + '/' + id)
        rows.push({
          field,
          text: el.textContent,
          textLength: el.getAttribute('textLength'),
          maxw: el.getAttribute('data-maxw'),
          len: (el as any).getComputedTextLength ? +(el as any).getComputedTextLength().toFixed(1) : null,
        })
      }
      const img = svg.querySelector('#image1276')
      const href = img?.getAttribute('xlink:href') ?? img?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? img?.getAttribute('href')
      const wm = svg.querySelector('[data-dyn="watermark"]')
      const dyn = [...svg.querySelectorAll('[data-dyn]')].map((e) => e.getAttribute('data-dyn') + '=' + e.textContent)
      // all tspans in whole svg that still have x AND non-empty text (potential leftovers)
      const allTspanWithXNonEmpty = [...svg.querySelectorAll('tspan[x]')]
        .filter((t) => (t.textContent ?? '').trim().length > 0)
        .map((t) => (t.id || '(noid)') + ': ' + (t.textContent ?? '').slice(0, 40))
      return {
        rows, withX, missing,
        hrefPrefix: href ? href.slice(0, 30) : null,
        hrefLen: href ? href.length : 0,
        watermark: wm ? wm.textContent : null,
        dyn,
        allTspanWithXNonEmpty,
        svgHtmlLen: (svg as any).outerHTML.length,
      }
    }, CAMPOS)

    console.log('\n================ MOCK:', mock, '(button found:', ok, ') ================')
    if ((res as any).fatal) { console.log((res as any).fatal); continue }
    const r = res as any
    console.log('missing ids:', r.missing.length ? r.missing : 'none')
    console.log('CAMPOS tspans that still have x attr:', r.withX.length ? r.withX : 'none')
    console.log('barcode image href:', r.hrefPrefix, '(len', r.hrefLen, ')')
    console.log('watermark:', r.watermark)
    console.log('data-dyn nodes:', r.dyn)
    console.log('--- field values ---')
    for (const row of r.rows) {
      const warn = row.maxw && row.len > +row.maxw + 0.5 ? '  <<OVERFLOW' : ''
      console.log(
        `  ${row.field.padEnd(30)} | ${JSON.stringify(row.text).padEnd(46)} | w=${row.len} tl=${row.textLength} maxw=${row.maxw}${warn}`,
      )
    }
    console.log('--- OTHER tspans still carrying x with non-empty text (template leftovers) ---')
    console.log(r.allTspanWithXNonEmpty.join('\n') || '  none')
    const newErrs = errors.slice(before)
    console.log('--- errors during this mock:', newErrs.length ? newErrs : 'none')
  }

  console.log('\n===== ALL ERRORS =====')
  console.log(errors.length ? errors.join('\n') : 'none')
  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
