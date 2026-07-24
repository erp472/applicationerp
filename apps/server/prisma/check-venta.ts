import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

async function main() {
  // ── Sesión del vendedor ───────────────────────────────────────────────────
  const sesion = await prisma.sesionCaja.findFirst({
    where:   { idsesiones_caja: 6 },
    include: {
      caja:           { select: { idcajas: true, codigocajas: true, nombrecajas: true, tipocajas: true } },
      usuarioApertura: { select: { idusuarios: true, nombreusuarios: true, emailusuarios: true } },
    },
  })
  console.log('\n── SESIÓN ──────────────────────────────────────────────')
  console.log(`  id:      ${sesion?.idsesiones_caja}`)
  console.log(`  estado:  ${sesion?.estadosesiones_caja}`)
  console.log(`  caja:    [${sesion?.caja.idcajas}] ${sesion?.caja.codigocajas} — ${sesion?.caja.nombrecajas} (${sesion?.caja.tipocajas})`)
  console.log(`  usuario: [${sesion?.usuarioApertura.idusuarios}] ${sesion?.usuarioApertura.emailusuarios}`)
  console.log(`  apertura: $${sesion?.monto_aperturasesiones_caja}`)

  // ── Ventas activas en la sesión ───────────────────────────────────────────
  const ventasActivas = await prisma.venta.count({
    where: { sesiones_caja_idsesiones_caja: 6, estadoventas: 'activa' },
  })
  console.log(`  ventas activas en sesión: ${ventasActivas}`)

  // ── Productos disponibles en la sucursal (con y sin stock) ───────────────
  const prods = await prisma.producto.findMany({
    where: {
      activoproductos:   true,
      deleted_atproductos: null,
      productosSucursal: { some: { sucursales_idsucursales: 1, activoproductos_sucursal: true } },
    },
    select: {
      idproductos: true, codigoproductos: true, nombreproductos: true,
      tipoproductos: true, precioproductos: true, porcentaje_taxproductos: true,
      cantidad_minima_ventaproductos: true, cantidad_maxima_ventaproductos: true,
      inventarioSucursal: {
        where:  { sucursales_idsucursales: 1 },
        select: { cantidad_actualinventario_sucursal: true, cantidad_minimainventario_sucursal: true },
      },
    },
    orderBy: [{ tipoproductos: 'asc' }, { nombreproductos: 'asc' }],
  })

  console.log('\n── PRODUCTOS EN SUCURSAL id=1 ──────────────────────────')
  const conStock    = prods.filter(p => (p.inventarioSucursal[0]?.cantidad_actualinventario_sucursal ?? 0) > 0)
  const sinRegistro = prods.filter(p => p.inventarioSucursal.length === 0)
  const sinStock    = prods.filter(p => p.inventarioSucursal.length > 0 && p.inventarioSucursal[0].cantidad_actualinventario_sucursal === 0)

  console.log(`  Total: ${prods.length}  |  Con stock: ${conStock.length}  |  Sin stock: ${sinStock.length}  |  Sin registro inv: ${sinRegistro.length}`)

  console.log('\n  [CON STOCK]:')
  for (const p of conStock) {
    const inv = p.inventarioSucursal[0]
    console.log(
      `    [${String(p.idproductos).padStart(3)}] ${p.tipoproductos.padEnd(11)} | ${p.codigoproductos.padEnd(18)} | $${String(p.precioproductos).padEnd(8)} | stock: ${inv.cantidad_actualinventario_sucursal}/${inv.cantidad_minimainventario_sucursal} | ${p.nombreproductos}`
    )
  }

  console.log('\n  [SIN REGISTRO EN INVENTARIO — vendibles sin control stock]:')
  for (const p of sinRegistro.slice(0, 10)) {
    console.log(
      `    [${String(p.idproductos).padStart(3)}] ${p.tipoproductos.padEnd(11)} | ${p.codigoproductos.padEnd(18)} | $${String(p.precioproductos).padEnd(8)} | ${p.nombreproductos}`
    )
  }
  if (sinRegistro.length > 10) console.log(`    ... y ${sinRegistro.length - 10} más`)

  // ── Resumen de movimientos caja ───────────────────────────────────────────
  const movimientos = await prisma.movimientoCaja.findMany({
    where:   { sesiones_caja_idsesiones_caja: 6 },
    orderBy: { created_atmovimientos_caja: 'asc' },
  })
  console.log('\n── MOVIMIENTOS CAJA sesión 6 ───────────────────────────')
  for (const m of movimientos) {
    console.log(`  ${m.tipomovimientos_caja.padEnd(20)} $${m.montomovimientos_caja}`)
  }
  if (movimientos.length === 0) console.log('  (ninguno)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
