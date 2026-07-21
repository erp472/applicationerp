/**
 * seed-productos-me.ts
 * Upsert de los 11 productos de Material de Empaque (ME).
 * Seguro de ejecutar sobre una base de datos existente.
 *
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-productos-me.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

const ME: Array<{ codigo: string; nombre: string; precio: number }> = [
  { codigo: 'ME-CES-S',   nombre: 'ME Caja Especial S 37x28x6',       precio: 11860 },
  { codigo: 'ME-CES-M',   nombre: 'ME Caja Especial M 37x28x14',      precio:  3700 },
  { codigo: 'ME-CES-G',   nombre: 'ME Caja Especial G 40x30x30',      precio:  5250 },
  { codigo: 'ME-BSG',     nombre: 'ME Bolsa de seguridad',             precio:   550 },
  { codigo: 'ME-SCC',     nombre: 'ME Sobre de Cartón Carta',          precio:   750 },
  { codigo: 'ME-CCO-S',   nombre: 'ME Caja Corriente S 50x40x30',     precio:  5050 },
  { codigo: 'ME-CCO-M',   nombre: 'ME Caja Corriente M 60x40x40',     precio: 11204 },
  { codigo: 'ME-SDP-HC',  nombre: "ME Sobre 'De-Para' Media Carta",   precio:   250 },
  { codigo: 'ME-SDP-C',   nombre: "ME Sobre 'De-Para' Carta",         precio:   250 },
  { codigo: 'ME-SDP-O',   nombre: "ME Sobre 'De-Para' Oficio",        precio:   350 },
  { codigo: 'ME-SDP-EO',  nombre: "ME Sobre 'De-Para' Extra Oficio",  precio:   450 },
]

async function main() {
  console.log(`\n📦  Upsert de ${ME.length} productos ME...\n`)

  // 1. Upsert productos
  const productoIds: number[] = []
  for (const p of ME) {
    const prod = await prisma.producto.upsert({
      where:  { codigoproductos: p.codigo },
      update: { nombreproductos: p.nombre, precioproductos: p.precio, activoproductos: true },
      create: {
        codigoproductos:         p.codigo,
        nombreproductos:         p.nombre,
        tipoproductos:           'empaque',
        precioproductos:         p.precio,
        porcentaje_taxproductos: 0,
        activoproductos:         true,
      },
    })
    productoIds.push(prod.idproductos)
    console.log(`  ✓  ${p.codigo.padEnd(14)}  ${p.nombre.padEnd(42)}  $${p.precio.toLocaleString('es-CO')}`)
  }

  // 2. Asociar a todas las sucursales activas
  const sucursales = await prisma.sucursal.findMany({ where: { activosucursales: true }, select: { idsucursales: true, nombresucursales: true } })
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
          sucursales_idsucursales: suc.idsucursales,
          productos_idproductos:   pid,
          activoproductos_sucursal: true,
        },
      })
    }
    console.log(`     ✓  ${suc.nombresucursales}`)
  }

  // 3. Inventario inicial (100 uds, mínimo 10)
  console.log('\n  → Creando inventario inicial (100 uds por sucursal)...')
  for (const suc of sucursales) {
    for (const pid of productoIds) {
      await prisma.inventarioSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: suc.idsucursales,
            productos_idproductos:   pid,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales:           suc.idsucursales,
          productos_idproductos:             pid,
          cantidad_actualinventario_sucursal: 100,
          cantidad_minimainventario_sucursal: 10,
        },
      })
    }
  }

  console.log(`\n✅  ${ME.length} productos ME listos en ${sucursales.length} sucursal(es).\n`)
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect().then(() => pool.end()))
