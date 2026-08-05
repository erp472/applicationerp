/**
 * Seed: tesoreria@4-72.com.co y inventarios@4-72.com.co
 * Idempotente. Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-tesoreria-inventarios.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'
import { hash }        from '@node-rs/bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

async function main() {
  const sucursal = await prisma.sucursal.findUniqueOrThrow({ where: { codigosucursales: 'SUC-BOG-001' } })

  const rolTesoreria   = await prisma.rol.findUniqueOrThrow({ where: { codigoroles: 'TESORERIA' } })
  const rolInventarios = await prisma.rol.findUniqueOrThrow({ where: { codigoroles: 'INVENTARIOS' } })

  const hashTesoreria   = await hash('Tesoreria.472!', 10)
  const hashInventarios = await hash('Inventarios.472!', 10)

  const tesoreria = await prisma.usuario.upsert({
    where:  { emailusuarios: 'tesoreria@4-72.com.co' },
    update: { password_hashusuarios: hashTesoreria, activousuarios: true },
    create: {
      sucursales_idsucursales: sucursal.idsucursales,
      roles_idroles:           rolTesoreria.idroles,
      nombreusuarios:          'Usuario Tesorería',
      emailusuarios:           'tesoreria@4-72.com.co',
      password_hashusuarios:   hashTesoreria,
      activousuarios:          true,
    },
  })

  const inventarios = await prisma.usuario.upsert({
    where:  { emailusuarios: 'inventarios@4-72.com.co' },
    update: { password_hashusuarios: hashInventarios, activousuarios: true },
    create: {
      sucursales_idsucursales: sucursal.idsucursales,
      roles_idroles:           rolInventarios.idroles,
      nombreusuarios:          'Usuario Inventarios',
      emailusuarios:           'inventarios@4-72.com.co',
      password_hashusuarios:   hashInventarios,
      activousuarios:          true,
    },
  })

  console.log(`✓ ${tesoreria.emailusuarios}    (id=${tesoreria.idusuarios}, rol=TESORERIA)`)
  console.log(`  Password: Tesoreria.472!`)
  console.log(`✓ ${inventarios.emailusuarios}  (id=${inventarios.idusuarios}, rol=INVENTARIOS)`)
  console.log(`  Password: Inventarios.472!`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
