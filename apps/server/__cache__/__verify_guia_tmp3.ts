import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'

// CAMPOS copiado literal del componente
const src = readFileSync('/Users/yusefgonzalez/proyectos/472/client/src/components/GuiaPostalSvg.tsx', 'utf8')
const block = src.split('const CAMPOS')[1].split('}\n')[0]
const CAMPOS: Record<string, string> = {}
for (const m of block.matchAll(/^\s*(\w+):\s*'([^']+)'/gm)) CAMPOS[m[1]] = m[2]

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

  const out = await page.evaluate(async (CAMPOS: Record<string, string>) => {
    ;(globalThis as any).__name = (globalThis as any).__name ?? ((f: any) => f)
    const gd: any = await import(/* @vite-ignore */ '/src/lib/guia-data.ts')
    const tpl: any = await import(/* @vite-ignore */ '/src/assets/guia-template.svg?raw')
    const guiaSvg: string = tpl.default

    // --- copias literales del componente ---
    const TEMPLATE = guiaSvg.replace(/<script[\s\S]*?<\/script>/g, '')
    const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    function injectField(svg: string, tspanId: string, value: string): string {
      const idPos = svg.indexOf(`id="${tspanId}"`)
      if (idPos === -1) return svg
      const tagStart = svg.lastIndexOf('<tspan', idPos)
      if (tagStart === -1) return svg
      const tagEnd = svg.indexOf('>', idPos) + 1
      if (tagEnd === 0) return svg
      const closeTag = svg.indexOf('</tspan>', tagEnd)
      if (closeTag === -1) return svg
      return svg.slice(0, tagEnd) + xmlEscape(value) + svg.slice(closeTag)
    }
    function buildSvgMarkup(guia: any): string {
      const data = gd.buildGuiaData(guia)
      let svg = TEMPLATE
      for (const [campo, id] of Object.entries(CAMPOS)) svg = injectField(svg, id, data[campo] ?? '')
      return svg
    }

    const cases: [string, any][] = [
      ['borrador vacio {}', {}],
      ['remitente parcial', { estado: 'BORRADOR', remitente: { nombre: 'ACME' } }],
      ['XML hostil', {
        numeroGuia: 'A&B<C>D"E',
        codigoBarras: 'RA185194038CO',
        remitente: { nombre: 'Tom & Jerry <b>bold</b>', direccion: 'Cra "7" #1', ciudad: 'A&B' },
        destinatario: { nombre: '</tspan></text><rect id="PWN" width="9999" height="9999" fill="red"/><tspan>' },
        observaciones: '&amp; ya escapado',
        contenido: "O'Brien & sons",
        centroOperativo: 'X & Y',
      }],
    ]

    const results: any[] = []
    for (const [name, guia] of cases) {
      let markup = '', err: string | null = null
      try { markup = buildSvgMarkup(guia) } catch (e: any) { err = 'THROW: ' + e.message }
      const div = document.createElement('div')
      document.body.appendChild(div)
      if (!err) div.innerHTML = markup
      const svg = div.querySelector('svg')
      const q = (id: string) => svg?.querySelector('#' + CSS.escape(id))?.textContent ?? null
      // parse XML estricto para ver si el markup es XML valido
      let xmlErr: string | null = null
      try {
        const d = new DOMParser().parseFromString(markup, 'image/svg+xml')
        const pe = d.querySelector('parsererror')
        xmlErr = pe ? pe.textContent!.slice(0, 160) : null
      } catch (e: any) { xmlErr = e.message }
      results.push({
        name, err, xmlErr,
        svgPresent: !!svg,
        tspanCount: svg ? svg.querySelectorAll('tspan').length : 0,
        pwnRect: div.querySelector('#PWN') ? 'INJECTION SUCCEEDED' : 'blocked',
        remNombre: q('tspan332'), remDir: q('tspan348'), remCiudad: q('tspan392'),
        destNombre: q('tspan456'), codigoGuia: q('tspan1238'),
        observaciones: q('tspan704'), diceContener: q('tspan_diceContener'),
        centro: q('tspan80'), pesoFisico: q('tspan576'), valorTotal: q('tspan672'),
        pieLegal3: q('tspan_pieLegal3'),
      })
      div.remove()
    }
    return results
  }, CAMPOS)

  console.log('===== buildSvgMarkup (sin useEffect) — degradado / hostil =====')
  for (const r of out) console.log(JSON.stringify(r, null, 1))

  // geometria
  const geom = await page.evaluate(async () => {
    ;([...document.querySelectorAll('button')].find((x) => x.textContent?.includes('SVG template')) as HTMLButtonElement)?.click()
    await new Promise((r) => setTimeout(r, 300))
    const res: any[] = []
    for (const mock of ['nacional', 'intl']) {
      ;([...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === mock) as HTMLButtonElement)?.click()
      await new Promise((r) => setTimeout(r, 500))
      const svg = document.querySelector('.guia-svg-root svg')!
      const bb = (id: string) => {
        const e = svg.querySelector('#' + CSS.escape(id)) as SVGGraphicsElement | null
        if (!e) return null
        const r = e.getBoundingClientRect()
        return [+r.left.toFixed(1), +r.right.toFixed(1)]
      }
      const sr = svg.getBoundingClientRect()
      res.push({ mock, svg: [+sr.left.toFixed(1), +sr.right.toFixed(1)],
        tipoEtiqueta: bb('tspan54'), label_centro_tspan68: bb('tspan68'),
        lateral_envio: bb('tspan_lateral_envio'), lat_der_centro: bb('tspan_lateral_derecho_centro') })
    }
    return res
  })
  console.log('\n===== geometria (px pantalla, zoom 0.75) =====')
  for (const g of geom) console.log(JSON.stringify(g))
  console.log('\n===== ERRORES =====')
  console.log(errors.length ? errors.join('\n') : 'none')
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
