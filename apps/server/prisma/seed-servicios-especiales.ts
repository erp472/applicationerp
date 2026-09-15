/**
 * seed-servicios-especiales.ts
 * Upsert completo de Servicios Especiales 4-72 con precios reales de VENTAESPECIAL472.txt.
 * Safe to re-run — uses delete+create for tarifas and upsert for productos.
 *
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-servicios-especiales.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Tarifa { min: number; max: number | null; precio: number }

interface SvcEspecial {
  codigo:         string
  nombre:         string
  precio:         number          // precio base (0 si usa tarifas por tramos)
  cantidadMinima: number | null
  cantidadMaxima: number | null
  tarifas?:       Tarifa[]
}

// ── Catálogo completo ─────────────────────────────────────────────────────────

const SERVICIOS: SvcEspecial[] = [

  // ── Administración de Correspondencia ─────────────────────────────────────
  // NOTA: SUP ($1.8M), AUX ($1.3M), MOT ($2.2M), CTR ($2.7M) eliminados —
  //       precios superan $1.000.000 COP (imposible en POS).

  {
    codigo: 'SVC-ADM-EQC', precio: 129_000, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ADM. DE CORRESPONDENCIA (EQ. COMUNICACIONES)',
  },

  // ── Alistamiento — tarifas por tramos ────────────────────────────────────

  {
    codigo: 'SVC-ALI-IPR', precio: 0, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (IMPRESIÓN Y PEGADO DE RÓTULOS)',
    tarifas: [
      { min: 1,      max: 1_000,  precio: 41 },
      { min: 1_001,  max: 5_000,  precio: 38 },
      { min: 5_001,  max: 10_000, precio: 38 },
      { min: 10_001, max: 20_000, precio: 36 },
      { min: 20_001, max: 50_000, precio: 35 },
      { min: 50_001, max: 100_000,precio: 28 },
      { min: 100_001,max: null,   precio: 25 },
    ],
  },
  {
    codigo: 'SVC-ALI-DPL', precio: 0, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (DOBLADO PLEGADO EN C O Z)',
    tarifas: [
      { min: 1,      max: 1_000,  precio: 8 },
      { min: 1_001,  max: 5_000,  precio: 8 },
      { min: 5_001,  max: 10_000, precio: 8 },
      { min: 10_001, max: 20_000, precio: 8 },
      { min: 20_001, max: 50_000, precio: 8 },
      { min: 50_001, max: 100_000,precio: 7 },
      { min: 100_001,max: null,   precio: 7 },
    ],
  },
  {
    codigo: 'SVC-ALI-ENS', precio: 0, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (ENSOBRADO)',
    tarifas: [
      { min: 1,      max: 1_000,  precio: 58 },
      { min: 1_001,  max: 5_000,  precio: 58 },
      { min: 5_001,  max: 10_000, precio: 49 },
      { min: 10_001, max: 20_000, precio: 49 },
      { min: 20_001, max: 50_000, precio: 48 },
      { min: 50_001, max: 100_000,precio: 46 },
      { min: 100_001,max: null,   precio: 44 },
    ],
  },
  {
    codigo: 'SVC-ALI-EMT', precio: 0, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (EMBOLSADO Y TERMOSELLADO)',
    tarifas: [
      { min: 1,      max: 5_000,  precio: 52   },
      { min: 5_001,  max: 20_000, precio: 44.5 },
      { min: 20_001, max: 50_000, precio: 43.5 },
      { min: 50_001, max: 100_000,precio: 42   },
      { min: 100_001,max: null,   precio: 40.5 },
    ],
  },
  {
    codigo: 'SVC-ALI-AUT', precio: 0, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (AUTOENSOBRADO)',
    tarifas: [
      { min: 1,       max: 20_000,  precio: 23.7 },
      { min: 20_001,  max: 100_000, precio: 22.3 },
      { min: 100_001, max: null,    precio: 20.9 },
    ],
  },
  {
    codigo: 'SVC-ALI-ROT', precio: 100, cantidadMinima: 1, cantidadMaxima: 10_000,
    nombre: 'ALISTAMIENTO (RÓTULOS)',
  },
  {
    codigo: 'SVC-ALI-IPG', precio: 22.30, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (IMPRESIÓN Y PEGADO DE GUÍA)',
  },
  {
    codigo: 'SVC-ALI-IPG-B', precio: 26.40, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (IMPRESIÓN Y PEGADO DE GUÍA - VAR. B)',
  },
  {
    codigo: 'SVC-ALI-PHR', precio: 0, cantidadMinima: null, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (PERSONAL HRS)',
  },
  {
    codigo: 'SVC-ALI-IUC', precio: 9.50, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (INSERTO A UN CUERPO)',
  },
  {
    codigo: 'SVC-ALI-IPR-V2', precio: 118.48, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (IMP. Y PEG. RÓTULOS — VARIANTE)',
  },
  {
    codigo: 'SVC-ALI-DPL-V2', precio: 17.56, cantidadMinima: 1, cantidadMaxima: null,
    nombre: 'ALISTAMIENTO (DOBLADO PEG. C/O/Z — VARIANTE)',
  },

  // ── Servicios Geográficos ─────────────────────────────────────────────────

  { codigo: 'SVC-GEO-REG', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'REGISTRO A GEOCODIFICAR' },
  { codigo: 'SVC-GEO-CP',  precio: 0,   cantidadMinima: 1, cantidadMaxima: null, nombre: 'CÓDIGO POSTAL' },
  { codigo: 'SVC-GEO-MAL', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'MALLA VIAL' },
  { codigo: 'SVC-GEO-EST', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'ESTRATO' },
  { codigo: 'SVC-GEO-SUE', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'USO DE SUELO' },
  { codigo: 'SVC-GEO-LMV', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'LONGITUD DE LA MALLA VIAL' },
  { codigo: 'SVC-GEO-BAR', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'BARRIO' },
  { codigo: 'SVC-GEO-MAN', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'NO. DE MANZANAS' },
  { codigo: 'SVC-GEO-HAB', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'NO. DE HABITANTES' },
  { codigo: 'SVC-GEO-ECO', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'NO. DE EMPRESAS COMERCIALES' },
  { codigo: 'SVC-GEO-EIN', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'NO. DE EMPRESAS INDUSTRIALES' },
  { codigo: 'SVC-GEO-EPS', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'NO. DE EMPRESAS PRESTADORES DE SERVICIOS' },
  { codigo: 'SVC-GEO-PEN', precio: 105, cantidadMinima: 1, cantidadMaxima: null, nombre: 'PENDIENTE' },
  { codigo: 'SVC-GEO-MAP', precio: 70_000,  cantidadMinima: 1, cantidadMaxima: null, nombre: 'GENERACIÓN DE MAPA (ESPACIAL A)' },
  { codigo: 'SVC-GEO-MAP2',precio: 100_000, cantidadMinima: 1, cantidadMaxima: null, nombre: 'GENERACIÓN DE MAPA (ESPACIAL — GENE.)' },
  {
    codigo: 'SVC-GEO-NOR', precio: 0, cantidadMinima: 10, cantidadMaxima: null,
    nombre: 'NORMALIZACIÓN',
    tarifas: [
      { min: 10,      max: 100,    precio: 0 },
      { min: 101,     max: 1_000,  precio: 0 },
      { min: 1_001,   max: 2_000,  precio: 0 },
      { min: 2_001,   max: 5_000,  precio: 0 },
      { min: 5_001,   max: 10_000, precio: 0 },
      { min: 10_001,  max: 50_000, precio: 0 },
      { min: 50_001,  max: 500_000,precio: 0 },
      { min: 500_001, max: null,   precio: 0 },
    ],
  },

  // ── Documentos y Oficina ─────────────────────────────────────────────────

  { codigo: 'SVC-DOC-CER', precio: 0,   cantidadMinima: null, cantidadMaxima: null, nombre: 'CERTIMAIL' },
  { codigo: 'SVC-DOC-CVT', precio: 0,   cantidadMinima: null, cantidadMaxima: null, nombre: 'CASILLERO VIRTUAL' },
  { codigo: 'SVC-DOC-FAX', precio: 1_000, cantidadMinima: 1, cantidadMaxima: null, nombre: 'SERVICIO DE FAX' },
  { codigo: 'SVC-DOC-IMP', precio: 200,   cantidadMinima: 1, cantidadMaxima: null, nombre: 'SERVICIO DE IMPRESIÓN' },
  { codigo: 'SVC-DOC-SCN', precio: 500,   cantidadMinima: 1, cantidadMaxima: null, nombre: 'SERVICIO DE SCANNER' },
  { codigo: 'SVC-DOC-FOT', precio: 100,   cantidadMinima: 1, cantidadMaxima: null, nombre: 'SERVICIO DE FOTOCOPIAS' },

  // ── Enriquecimiento de Datos ─────────────────────────────────────────────

  {
    codigo: 'SVC-ENR-P1', precio: 0, cantidadMinima: 10, cantidadMaxima: null,
    nombre: 'ENRIQUECIMIENTO DE VARIABLES — PAQUETE 1',
    tarifas: [
      { min: 10,      max: 100,    precio: 560 },
      { min: 101,     max: 1_000,  precio: 409 },
      { min: 1_001,   max: 2_000,  precio: 302 },
      { min: 2_001,   max: 5_000,  precio: 222 },
      { min: 5_001,   max: 10_000, precio: 160 },
      { min: 10_001,  max: 50_000, precio: 120 },
      { min: 50_001,  max: 100_000,precio: 86  },
      { min: 100_001, max: 250_000,precio: 63  },
      { min: 250_001, max: 500_000,precio: 46  },
      { min: 500_001, max: null,   precio: 36  },
    ],
  },
  {
    codigo: 'SVC-ENR-P2', precio: 0, cantidadMinima: 10, cantidadMaxima: null,
    nombre: 'ENRIQUECIMIENTO DE VARIABLES — PAQUETE 2',
    tarifas: [
      { min: 10,      max: 100,    precio: 620 },
      { min: 101,     max: 1_000,  precio: 453 },
      { min: 1_001,   max: 2_000,  precio: 339 },
      { min: 2_001,   max: 5_000,  precio: 250 },
      { min: 5_001,   max: 10_000, precio: 179 },
      { min: 10_001,  max: 50_000, precio: 134 },
      { min: 50_001,  max: 100_000,precio: 96  },
      { min: 100_001, max: 250_000,precio: 70  },
      { min: 250_001, max: 500_000,precio: 51  },
      { min: 500_001, max: null,   precio: 42  },
    ],
  },
  {
    codigo: 'SVC-ENR-P3', precio: 0, cantidadMinima: 10, cantidadMaxima: null,
    nombre: 'ENRIQUECIMIENTO DE VARIABLES — PAQUETE 3',
    tarifas: [
      { min: 10,      max: 100,    precio: 740 },
      { min: 101,     max: 1_000,  precio: 540 },
      { min: 1_001,   max: 2_000,  precio: 413 },
      { min: 2_001,   max: 5_000,  precio: 304 },
      { min: 5_001,   max: 10_000, precio: 218 },
      { min: 10_001,  max: 50_000, precio: 164 },
      { min: 50_001,  max: 100_000,precio: 117 },
      { min: 100_001, max: 250_000,precio: 86  },
      { min: 250_001, max: 500_000,precio: 62  },
      { min: 500_001, max: null,   precio: 54  },
    ],
  },
  {
    codigo: 'SVC-ENR-P4', precio: 0, cantidadMinima: 10, cantidadMaxima: null,
    nombre: 'ENRIQUECIMIENTO DE VARIABLES — PAQUETE 4',
    tarifas: [
      { min: 10,      max: 100,    precio: 800 },
      { min: 101,     max: 1_000,  precio: 584 },
      { min: 1_001,   max: 2_000,  precio: 451 },
      { min: 2_001,   max: 5_000,  precio: 332 },
      { min: 5_001,   max: 10_000, precio: 238 },
      { min: 10_001,  max: 50_000, precio: 179 },
      { min: 50_001,  max: 100_000,precio: 128 },
      { min: 100_001, max: 250_000,precio: 94  },
      { min: 250_001, max: 500_000,precio: 68  },
      { min: 500_001, max: null,   precio: 60  },
    ],
  },

  // ── Material ──────────────────────────────────────────────────────────────

  { codigo: 'SVC-MAT-PRU', precio: 100, cantidadMinima: 1, cantidadMaxima: 1_000, nombre: 'MATERIAL DE PRUEBAS' },
]

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌐  Sincronizando ${SERVICIOS.length} Servicios Especiales...\n`)

  const productoIds: number[] = []

  for (const s of SERVICIOS) {
    const prod = await prisma.producto.upsert({
      where:  { codigoproductos: s.codigo },
      update: {
        nombreproductos:                s.nombre,
        precioproductos:                s.precio,
        activoproductos:                true,
        cantidad_minima_ventaproductos: s.cantidadMinima,
        cantidad_maxima_ventaproductos: s.cantidadMaxima,
      },
      create: {
        codigoproductos:                s.codigo,
        nombreproductos:                s.nombre,
        tipoproductos:                  'otro',
        precioproductos:                s.precio,
        porcentaje_taxproductos:        0,
        activoproductos:                true,
        cantidad_minima_ventaproductos: s.cantidadMinima,
        cantidad_maxima_ventaproductos: s.cantidadMaxima,
      },
    })
    productoIds.push(prod.idproductos)

    const precio = s.precio > 0 ? `$${s.precio.toLocaleString()}` : (s.tarifas ? `${s.tarifas.length} tramos` : 'sin precio')
    console.log(`  ✓  ${s.codigo.padEnd(14)}  ${precio.padEnd(14)}  ${s.nombre}`)

    // Reemplazar tarifas por tramos (delete-then-create para evitar solapados huérfanos)
    if (s.tarifas && s.tarifas.length > 0) {
      await (prisma as any).tarifaEspecialCantidad.deleteMany({
        where: { productos_idproductos: prod.idproductos },
      })
      await (prisma as any).tarifaEspecialCantidad.createMany({
        data: s.tarifas.map(t => ({
          productos_idproductos:          prod.idproductos,
          min_cantidadtarifas_especial:   t.min,
          max_cantidadtarifas_especial:   t.max,
          preciotarifas_especial:         t.precio,
          activotarifas_especial:         true,
        })),
      })
      console.log(`       ↳ ${s.tarifas.length} tramos de tarifa`)
    } else {
      // Para productos con precio fijo, eliminar tarifas obsoletas si existían
      const deleted = await (prisma as any).tarifaEspecialCantidad.deleteMany({
        where: { productos_idproductos: prod.idproductos },
      })
      if (deleted.count > 0) {
        console.log(`       ↳ ${deleted.count} tarifas obsoletas eliminadas (precio fijo)`)
      }
    }
  }

  // Asociar a todas las sucursales activas
  const sucursales = await prisma.sucursal.findMany({
    where:  { activosucursales: true },
    select: { idsucursales: true, nombresucursales: true },
  })
  console.log(`\n  → Vinculando a ${sucursales.length} sucursal(es)...`)

  for (const suc of sucursales) {
    for (const pid of productoIds) {
      await prisma.productoSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: suc.idsucursales,
            productos_idproductos:   pid,
          },
        },
        update: { activoproductos_sucursal: true },
        create: {
          sucursales_idsucursales:  suc.idsucursales,
          productos_idproductos:    pid,
          activoproductos_sucursal: true,
        },
      })
    }
  }
  console.log(`     ✓  ${sucursales.length} sucursales vinculadas\n`)
  console.log(`✅  ${SERVICIOS.length} Servicios Especiales sincronizados con precios reales.\n`)
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect().then(() => pool.end()))
