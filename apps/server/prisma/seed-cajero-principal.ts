/**
 * Seed: cajero.principal@4-72.com.co — SUPERVISOR_REGIONAL
 *
 * Este usuario ve TODOS los puntos de venta (cajas) de la sucursal.
 * El vendedor (CAJERO) solo verá su propia caja.
 *
 * Idempotente. Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-cajero-principal.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'
import { hash }        from '@node-rs/bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

async function main() {
  const rolSupervisor = await prisma.rol.findUniqueOrThrow({ where: { codigoroles: 'SUPERVISOR_REGIONAL' } })
  const sucursal      = await prisma.sucursal.findUniqueOrThrow({ where: { codigosucursales: 'SUC-BOG-001' } })

  const passwordHash = await hash('Cajero.Principal472', 10)

  const usuario = await prisma.usuario.upsert({
    where:  { emailusuarios: 'cajero.principal@4-72.com.co' },
    update: { password_hashusuarios: passwordHash, activousuarios: true },
    create: {
      sucursales_idsucursales: sucursal.idsucursales,
      roles_idroles:           rolSupervisor.idroles,
      nombreusuarios:          'Cajero Principal',
      emailusuarios:           'cajero.principal@4-72.com.co',
      password_hashusuarios:   passwordHash,
      activousuarios:          true,
    },
  })

  console.log(`✓ ${usuario.emailusuarios}  (id=${usuario.idusuarios}, rol=SUPERVISOR_REGIONAL, sucursal=${sucursal.idsucursales})`)
  console.log(`  Password: Cajero.Principal472`)
  console.log(`  Ruta:     /cajas/principales/${sucursal.idsucursales}  → ve TODOS los puntos de venta`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
