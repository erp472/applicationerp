/**
 * seed-estampillas.ts
 * Seed de 14 estampillas postales con prefijo ES-.
 *
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-estampillas.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

const ESTAMPILLAS = [
  { codigo: 'ES-001', nombre: 'ES 100 Años Escuela Superior de Guerra',               precio:  5500 },
  { codigo: 'ES-002', nombre: 'ES Federación Nacional de Cafeteros de Colombia 90',   precio:    50 },
  { codigo: 'ES-003', nombre: 'ES Policarpa Salavarrieta bicentenario de su sacri',   precio:   100 },
  { codigo: 'ES-004', nombre: 'ES C.R.I',                                              precio:  2600 },
  { codigo: 'ES-005', nombre: 'ES Premio Nobel de la Paz 2016 Juan Manuel Santos',    precio:    20 },
  { codigo: 'ES-006', nombre: 'ES 1er Festival Internacional de Historia',            precio:  1000 },
  { codigo: 'ES-007', nombre: 'ES XXIII Juegos Centroamericano y del Caribe Baran',  precio:   200 },
  { codigo: 'ES-008', nombre: 'ES Buque Escuela Gloria 50 Años 1968-2018',           precio:  5000 },
  { codigo: 'ES-009', nombre: 'ES Batallon Guardia Presidencial 90 Años',            precio:   200 },
  { codigo: 'ES-010', nombre: 'ES Orquideas Endemicas de Colombia',                  precio:   500 },
  { codigo: 'ES-011', nombre: 'ES Region del Catatumbo y Provincia de Ocaña',        precio:  1000 },
  { codigo: 'ES-012', nombre: 'ES Comunicaciones Fuerzas Militares 74 Años 1944-2', precio:    20 },
  { codigo: 'ES-013', nombre: 'ES America UPAEP 2018 Animales Domesticos',           precio:  4000 },
  { codigo: 'ES-014', nombre: 'ES Navidad 2018',                                     precio: 10000 },
]

async function main() {
  console.log('Seeding estampillas...\n')

  const sucursales = await prisma.sucursal.findMany({
    where:  { activosucursales: true },
    select: { idsucursales: true },
  })

  for (const e of ESTAMPILLAS) {
    const producto = await prisma.producto.upsert({
      where:  { codigoproductos: e.codigo },
      update: { nombreproductos: e.nombre, precioproductos: e.precio, activoproductos: true },
      create: {
        codigoproductos:         e.codigo,
        nombreproductos:         e.nombre,
        precioproductos:         e.precio,
        tipoproductos:           'estampilla',
        porcentaje_taxproductos: 0,
        activoproductos:         true,
      },
    })

    for (const s of sucursales) {
      await prisma.productoSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: s.idsucursales,
            productos_idproductos:   producto.idproductos,
          },
        },
        update: { activoproductos_sucursal: true },
        create: {
          sucursales_idsucursales:  s.idsucursales,
          productos_idproductos:    producto.idproductos,
          activoproductos_sucursal: true,
        },
      })
    }

    console.log(`  ✓ ${e.codigo} — ${e.nombre}  →  $${e.precio.toLocaleString('es-CO')}`)
  }

  console.log(`\nDone: ${ESTAMPILLAS.length} estampillas en ${sucursales.length} sucursales.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
