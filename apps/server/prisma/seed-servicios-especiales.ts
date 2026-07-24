/**
 * seed-servicios-especiales.ts
 * Upsert de los 37 Servicios Especiales 4-72 (tipo='otro').
 * Seguro de ejecutar sobre una base de datos existente.
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

interface SvcEspecial {
  codigo:         string
  nombre:         string
  cantidadMinima: number | null
  cantidadMaxima: number | null
}

const SERVICIOS: SvcEspecial[] = [
  // ── Administración de Correspondencia ────────────────────────────────────
  { codigo: 'SVC-ADM-SUP', nombre: 'ADM. DE CORRESPONDENCIA (SUPERVISOR)',        cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ADM-AUX', nombre: 'ADM. DE CORRESPONDENCIA (AUXILIAR)',          cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ADM-EQC', nombre: 'ADM. DE CORRESPONDENCIA (EQ. COMUNICACIONES)',cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ADM-MOT', nombre: 'ADM. DE CORRESPONDENCIA (MOTORIZADO)',        cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ADM-CTR', nombre: 'ADM. DE CORRESPONDENCIA (COUNTER)',           cantidadMinima: 1, cantidadMaxima: null },

  // ── Alistamiento ─────────────────────────────────────────────────────────
  { codigo: 'SVC-ALI-IPR', nombre: 'ALISTAMIENTO (IMPRESIÓN Y PEGADO DE RÓTULOS)',cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-DPL', nombre: 'ALISTAMIENTO (DOBLADO PLEGADO EN C O Z)',     cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-ENS', nombre: 'ALISTAMIENTO (ENSOBRADO)',                    cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-EMT', nombre: 'ALISTAMIENTO (EMBOLSADO Y TERMOSELLADO)',     cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-AUT', nombre: 'ALISTAMIENTO (AUTOENSOBRADO)',                cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-ROT', nombre: 'ALISTAMIENTO (RÓTULOS)',                      cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-IPG', nombre: 'ALISTAMIENTO (IMPRESIÓN Y PEGADO DE GUÍA)',   cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-PHR', nombre: 'ALISTAMIENTO (PERSONAL HRS)',                 cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ALI-IUC', nombre: 'ALISTAMIENTO (INSERTO A UN CUERPO)',          cantidadMinima: 1, cantidadMaxima: null },

  // ── Servicios Geográficos ─────────────────────────────────────────────────
  { codigo: 'SVC-GEO-REG', nombre: 'REGISTRO A GEOCODIFICAR',                              cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-CP',  nombre: 'CÓDIGO POSTAL',                                        cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-MAL', nombre: 'MALLA VIAL',                                           cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-EST', nombre: 'ESTRATO',                                              cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-SUE', nombre: 'USO DE SUELO',                                         cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-LMV', nombre: 'LONGITUD DE LA MALLA VIAL',                            cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-BAR', nombre: 'BARRIO',                                               cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-MAN', nombre: 'NO. DE MANZANAS',                                      cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-HAB', nombre: 'NO. DE HABITANTES',                                    cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-ECO', nombre: 'NO. DE EMPRESAS COMERCIALES',                          cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-EIN', nombre: 'NO. DE EMPRESAS INDUSTRIALES',                         cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-EPS', nombre: 'NO. DE EMPRESAS PRESTADORES DE SERVICIOS',             cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-MAP', nombre: 'Generación de Mapa (Valor por cada mapa espacial a...)',cantidadMinima: 1,   cantidadMaxima: null },
  { codigo: 'SVC-GEO-PEN', nombre: 'PENDIENTE',                                            cantidadMinima: null,cantidadMaxima: null },
  { codigo: 'SVC-GEO-NOR', nombre: 'NORMALIZACION',                                        cantidadMinima: 1,   cantidadMaxima: null },

  // ── Documentos y Oficina ─────────────────────────────────────────────────
  { codigo: 'SVC-DOC-CER', nombre: 'CERTIMAIL',           cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-DOC-CVT', nombre: 'CASILLERO VIRTUAL',   cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-DOC-FAX', nombre: 'SERVICIO DE FAX',     cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-DOC-IMP', nombre: 'SERVICIO DE IMPRESIÓN',  cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-DOC-SCN', nombre: 'SERVICIO DE SCANNER',    cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-DOC-FOT', nombre: 'SERVICIO DE FOTOCOPIAS', cantidadMinima: 1, cantidadMaxima: null },

  // ── Enriquecimiento de Datos ──────────────────────────────────────────────
  { codigo: 'SVC-ENR-P1', nombre: 'Enriquecimiento de variables paquete 1', cantidadMinima: 1, cantidadMaxima: null },
  { codigo: 'SVC-ENR-P2', nombre: 'Enriquecimiento de variables paquete 2', cantidadMinima: 1, cantidadMaxima: null },
]

async function main() {
  console.log(`\n🌐  Upsert de ${SERVICIOS.length} Servicios Especiales...\n`)

  // 1. Upsert productos
  const productoIds: number[] = []
  for (const s of SERVICIOS) {
    const prod = await prisma.producto.upsert({
      where:  { codigoproductos: s.codigo },
      update: {
        nombreproductos:                s.nombre,
        activoproductos:                true,
        cantidad_minima_ventaproductos: s.cantidadMinima,
        cantidad_maxima_ventaproductos: s.cantidadMaxima,
      },
      create: {
        codigoproductos:                s.codigo,
        nombreproductos:                s.nombre,
        tipoproductos:                  'otro',
        precioproductos:                0,
        porcentaje_taxproductos:        0,
        activoproductos:                true,
        cantidad_minima_ventaproductos: s.cantidadMinima,
        cantidad_maxima_ventaproductos: s.cantidadMaxima,
      },
    })
    productoIds.push(prod.idproductos)
    const minStr = s.cantidadMinima !== null ? String(s.cantidadMinima) : '—'
    const maxStr = s.cantidadMaxima !== null ? String(s.cantidadMaxima) : '—'
    console.log(`  ✓  ${s.codigo.padEnd(12)}  min=${minStr.padEnd(4)} max=${maxStr.padEnd(6)}  ${s.nombre}`)
  }

  // 2. Asociar a todas las sucursales activas
  const sucursales = await prisma.sucursal.findMany({
    where:  { activosucursales: true },
    select: { idsucursales: true, nombresucursales: true },
  })
  console.log(`\n  → Asociando a ${sucursales.length} sucursal(es)...`)

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
  console.log(`     ✓  ${sucursales.length} sucursales vinculadas`)

  // 3. Tarifas por rango de cantidad para servicios de alistamiento
  const TARIFAS_ALISTAMIENTO: { codigo: string; tarifas: { min: number; max: number | null; precio: number }[] }[] = [
    {
      codigo: 'SVC-ALI-IPR',
      tarifas: [
        { min: 1,      max: 1000,   precio: 41 },
        { min: 1001,   max: 5000,   precio: 38 },
        { min: 5001,   max: 10000,  precio: 38 },
        { min: 10001,  max: 20000,  precio: 36 },
        { min: 20001,  max: 50000,  precio: 35 },
        { min: 50001,  max: 100000, precio: 33 },
        { min: 100001, max: null,   precio: 30 },
      ],
    },
    {
      codigo: 'SVC-ALI-DPL',
      tarifas: [
        { min: 1,      max: 1000,   precio: 41 },
        { min: 1001,   max: 5000,   precio: 38 },
        { min: 5001,   max: 10000,  precio: 38 },
        { min: 10001,  max: 20000,  precio: 36 },
        { min: 20001,  max: 50000,  precio: 35 },
        { min: 50001,  max: 100000, precio: 33 },
        { min: 100001, max: null,   precio: 30 },
      ],
    },
    {
      codigo: 'SVC-ALI-ENS',
      tarifas: [
        { min: 1,      max: 1000,   precio: 41 },
        { min: 1001,   max: 5000,   precio: 38 },
        { min: 5001,   max: 10000,  precio: 38 },
        { min: 10001,  max: 20000,  precio: 36 },
        { min: 20001,  max: 50000,  precio: 35 },
        { min: 50001,  max: 100000, precio: 33 },
        { min: 100001, max: null,   precio: 30 },
      ],
    },
    {
      codigo: 'SVC-ALI-EMT',
      tarifas: [
        { min: 1,      max: 1000,   precio: 41 },
        { min: 1001,   max: 5000,   precio: 38 },
        { min: 5001,   max: 10000,  precio: 38 },
        { min: 10001,  max: 20000,  precio: 36 },
        { min: 20001,  max: 50000,  precio: 35 },
        { min: 50001,  max: 100000, precio: 33 },
        { min: 100001, max: null,   precio: 30 },
      ],
    },
    {
      codigo: 'SVC-ALI-ROT',
      tarifas: [
        { min: 1,      max: 1000,   precio: 41 },
        { min: 1001,   max: 5000,   precio: 38 },
        { min: 5001,   max: 10000,  precio: 38 },
        { min: 10001,  max: 20000,  precio: 36 },
        { min: 20001,  max: 50000,  precio: 35 },
        { min: 50001,  max: 100000, precio: 33 },
        { min: 100001, max: null,   precio: 30 },
      ],
    },
  ]

  console.log('\n  → Creando tarifas por cantidad...')
  for (const svc of TARIFAS_ALISTAMIENTO) {
    const prod = await prisma.producto.findUnique({ where: { codigoproductos: svc.codigo } })
    if (!prod) { console.log(`  ⚠️  Producto ${svc.codigo} no encontrado, saltando tarifas`); continue }
    for (const t of svc.tarifas) {
      await (prisma as any).tarifaEspecialCantidad.upsert({
        where: {
          productos_idproductos_min_cantidadtarifas_especial: {
            productos_idproductos:        prod.idproductos,
            min_cantidadtarifas_especial: t.min,
          },
        },
        update: { preciotarifas_especial: t.precio, max_cantidadtarifas_especial: t.max, activotarifas_especial: true },
        create: {
          productos_idproductos:          prod.idproductos,
          min_cantidadtarifas_especial:   t.min,
          max_cantidadtarifas_especial:   t.max,
          preciotarifas_especial:         t.precio,
          activotarifas_especial:         true,
        },
      })
    }
    console.log(`     ✓  ${svc.codigo}: ${svc.tarifas.length} tramos de tarifa`)
  }

  console.log(`\n✅  ${SERVICIOS.length} Servicios Especiales listos en ${sucursales.length} sucursal(es).\n`)
  console.log('   ⚠️  Los precios quedan en $0 — actualizar desde Admin → Productos.\n')
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect().then(() => pool.end()))
