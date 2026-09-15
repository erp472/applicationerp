import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TramoTarifa = {
  peso_min:        number
  peso_max:        number | null
  tarifa:          number
  tarifa_kg_adic?: number
  // Para servicios nacionales: tipo de trayecto. null = NACIONAL (default fallback).
  // Valores: null | 'URBANO' | 'ESPECIAL'
  trayecto?:       string | null
}

// ── Tarifas por servicio ──────────────────────────────────────────────────────
//
// Pesos en KG.  Tarifas en COP enteros.
// Fuente: https://www.4-72.com.co (datos extraídos 2026-08-11).
//
// Para correspondencia nacional la tarifa varía según tipo de trayecto:
//   null     → NACIONAL estándar (intercity regular — lookup fallback)
//   URBANO   → misma ciudad / municipio
//   ESPECIAL → trayecto especial (≥8 imposiciones/año — tarifa diferenciada)
//
// CERT y NOR comparten los mismos tramos base; la certificación se cobra como
// tarifa_certificacion aparte en el modelo Servicio.

const tarifasCorreo: { codigo: string; tramos: TramoTarifa[] }[] = [

  // ── Correspondencia No Prioritaria Normal — Documentos ────────────────────
  //   NP-DOC-NOR (sin cert)  y  NP-DOC-CERT (con cert) — mismos tramos base
  //   Tabla oficial 2024:
  //   | Rango (gr)   | Urbano | Nacional | Especial (≥8/año) |
  //   | 0 – 1.000    |  5.350 |    8.000 |            39.300 |
  //   | 1.001 – 2.000|  8.150 |   13.000 |            56.250 |
  {
    codigo: 'NP-DOC-NOR',
    tramos: [
      { peso_min: 0, peso_max: 1,    tarifa:  8000, trayecto: null       },
      { peso_min: 0, peso_max: 1,    tarifa:  5350, trayecto: 'URBANO'   },
      { peso_min: 0, peso_max: 1,    tarifa: 39300, trayecto: 'ESPECIAL' },
      { peso_min: 1, peso_max: 2,    tarifa: 13000, trayecto: null       },
      { peso_min: 1, peso_max: 2,    tarifa:  8150, trayecto: 'URBANO'   },
      { peso_min: 1, peso_max: 2,    tarifa: 56250, trayecto: 'ESPECIAL' },
    ],
  },
  {
    codigo: 'NP-DOC-CERT',
    tramos: [
      { peso_min: 0, peso_max: 1,    tarifa:  8000, trayecto: null       },
      { peso_min: 0, peso_max: 1,    tarifa:  5350, trayecto: 'URBANO'   },
      { peso_min: 0, peso_max: 1,    tarifa: 39300, trayecto: 'ESPECIAL' },
      { peso_min: 1, peso_max: 2,    tarifa: 13000, trayecto: null       },
      { peso_min: 1, peso_max: 2,    tarifa:  8150, trayecto: 'URBANO'   },
      { peso_min: 1, peso_max: 2,    tarifa: 56250, trayecto: 'ESPECIAL' },
    ],
  },

  // ── Correspondencia Prioritaria Normal — Documentos ───────────────────────
  //   | Rango (gr)   | Urbano | Nacional | Especial (≥8/año) |
  //   | 0 – 1.000    |  5.700 |    8.600 |            39.300 |
  //   | 1.001 – 2.000|  8.650 |   14.050 |            56.250 |
  {
    codigo: 'P-DOC-NOR',
    tramos: [
      { peso_min: 0, peso_max: 1,    tarifa:  8600, trayecto: null       },
      { peso_min: 0, peso_max: 1,    tarifa:  5700, trayecto: 'URBANO'   },
      { peso_min: 0, peso_max: 1,    tarifa: 39300, trayecto: 'ESPECIAL' },
      { peso_min: 1, peso_max: 2,    tarifa: 14050, trayecto: null       },
      { peso_min: 1, peso_max: 2,    tarifa:  8650, trayecto: 'URBANO'   },
      { peso_min: 1, peso_max: 2,    tarifa: 56250, trayecto: 'ESPECIAL' },
    ],
  },
  {
    codigo: 'P-DOC-CERT',
    tramos: [
      { peso_min: 0, peso_max: 1,    tarifa:  8600, trayecto: null       },
      { peso_min: 0, peso_max: 1,    tarifa:  5700, trayecto: 'URBANO'   },
      { peso_min: 0, peso_max: 1,    tarifa: 39300, trayecto: 'ESPECIAL' },
      { peso_min: 1, peso_max: 2,    tarifa: 14050, trayecto: null       },
      { peso_min: 1, peso_max: 2,    tarifa:  8650, trayecto: 'URBANO'   },
      { peso_min: 1, peso_max: 2,    tarifa: 56250, trayecto: 'ESPECIAL' },
    ],
  },

  // ── Paquetes (tarifas fuente interna — pendiente de actualizar con PDF 4-72) ─
  { codigo: 'NP-PAQ-NOR', tramos: [
    { peso_min: 0,   peso_max: 1,    tarifa:  4850 },
    { peso_min: 1,   peso_max: 2,    tarifa:  9500 },
    { peso_min: 2,   peso_max: 5,    tarifa: 16000 },
    { peso_min: 5,   peso_max: 10,   tarifa: 27000 },
    { peso_min: 10,  peso_max: 20,   tarifa: 48000 },
    { peso_min: 20,  peso_max: null, tarifa: 75000, tarifa_kg_adic: 3500 },
  ]},
  { codigo: 'NP-PAQ-CERT', tramos: [
    { peso_min: 0,   peso_max: 1,    tarifa:  4850 },
    { peso_min: 1,   peso_max: 2,    tarifa:  9500 },
    { peso_min: 2,   peso_max: 5,    tarifa: 16000 },
    { peso_min: 5,   peso_max: 10,   tarifa: 27000 },
    { peso_min: 10,  peso_max: 20,   tarifa: 48000 },
    { peso_min: 20,  peso_max: null, tarifa: 75000, tarifa_kg_adic: 3500 },
  ]},
  { codigo: 'P-PAQ-NOR', tramos: [
    { peso_min: 0,   peso_max: 1,    tarifa:  6800 },
    { peso_min: 1,   peso_max: 2,    tarifa: 13300 },
    { peso_min: 2,   peso_max: 5,    tarifa: 22400 },
    { peso_min: 5,   peso_max: 10,   tarifa: 37800 },
    { peso_min: 10,  peso_max: 20,   tarifa: 67200 },
    { peso_min: 20,  peso_max: null, tarifa: 105000, tarifa_kg_adic: 4900 },
  ]},
  { codigo: 'P-PAQ-CERT', tramos: [
    { peso_min: 0,   peso_max: 1,    tarifa:  6800 },
    { peso_min: 1,   peso_max: 2,    tarifa: 13300 },
    { peso_min: 2,   peso_max: 5,    tarifa: 22400 },
    { peso_min: 5,   peso_max: 10,   tarifa: 37800 },
    { peso_min: 10,  peso_max: 20,   tarifa: 67200 },
    { peso_min: 20,  peso_max: null, tarifa: 105000, tarifa_kg_adic: 4900 },
  ]},

  // ── Al Día ────────────────────────────────────────────────────────────────
  //   0 – 2.000 g | Nacional = $64.250 | Urbano = $18.200
  {
    codigo: 'AL-DIA',
    tramos: [
      { peso_min: 0, peso_max: 2, tarifa: 64250, trayecto: null      }, // NACIONAL default
      { peso_min: 0, peso_max: 2, tarifa: 18200, trayecto: 'URBANO'  },
    ],
  },

  // ── Notificaciones ────────────────────────────────────────────────────────
  //   0 – 2.000 g | Urbano = $18.200 | Regional = $21.500 | Nacional = $30.650
  {
    codigo: 'NOTIF',
    tramos: [
      { peso_min: 0, peso_max: 2, tarifa: 30650, trayecto: null       }, // NACIONAL default
      { peso_min: 0, peso_max: 2, tarifa: 18200, trayecto: 'URBANO'   },
      { peso_min: 0, peso_max: 2, tarifa: 21500, trayecto: 'REGIONAL' },
    ],
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Actualizando tarifas correo nacional 4-72 (2024)...\n')

  let total = 0
  for (const svc of tarifasCorreo) {
    const servicio = await prisma.servicio.findFirst({
      where:  { codigoservicios: svc.codigo, deleted_atservicios: null },
      select: { idservicios: true },
    })
    if (!servicio) {
      console.warn(`  WARN: servicio '${svc.codigo}' no encontrado — omitido`)
      continue
    }
    const svcId = servicio.idservicios

    // Reemplazar todos los tramos existentes
    await prisma.tarifaServicio.deleteMany({ where: { servicios_idservicios: svcId } })

    for (const t of svc.tramos) {
      await prisma.tarifaServicio.create({
        data: {
          servicios_idservicios:               svcId,
          pais_destinotarifas_servicio:        'CO',
          ciudad_destinotarifas_servicio:      t.trayecto ?? null,
          peso_min_kgtarifas_servicio:         t.peso_min,
          peso_max_kgtarifas_servicio:         t.peso_max ?? null,
          tarifatarifas_servicio:              t.tarifa,
          tarifa_kg_adicionaltarifas_servicio: t.tarifa_kg_adic ?? null,
          activatarifas_servicio:              true,
        },
      })
      total++
    }
    console.log(`  ${svc.codigo}: ${svc.tramos.length} tramos`)
  }

  console.log(`\nListo: ${total} tarifas en ${tarifasCorreo.length} servicios.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
