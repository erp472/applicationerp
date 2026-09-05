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

  // Nunca se toca la contraseña de un usuario ya creado: si existe, se deja intacto.
  async function crearSiNoExiste(email: string, nombre: string, rolId: number, password: string) {
    const existente = await prisma.usuario.findFirst({ where: { emailusuarios: email } })
    if (existente) {
      console.log(`= ${email} ya existe (id=${existente.idusuarios}) — sin cambios`)
      return
    }
    const creado = await prisma.usuario.create({
      data: {
        sucursales_idsucursales: sucursal.idsucursales,
        roles_idroles:           rolId,
        nombreusuarios:          nombre,
        emailusuarios:           email,
        password_hashusuarios:   await hash(password, 10),
        activousuarios:          true,
      },
    })
    console.log(`✓ ${email} (id=${creado.idusuarios})`)
    console.log(`  Password: ${password}`)
  }

  await crearSiNoExiste('tesoreria@4-72.com.co',   'Usuario Tesorería',  rolTesoreria.idroles,   'Tesoreria.472!')
  await crearSiNoExiste('inventarios@4-72.com.co', 'Usuario Inventarios', rolInventarios.idroles, 'Inventarios.472!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
