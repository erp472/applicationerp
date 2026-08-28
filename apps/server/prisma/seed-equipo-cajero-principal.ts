/**
 * Registra el equipo del Cajero Principal (SUPERVISOR_REGIONAL) en EquipoAutorizado.
 * Idempotente — upsert por MAC address.
 *
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-equipo-cajero-principal.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const MAC     = '26:24:a9:44:0e:2a'
const SUCURSAL = 'SUC-BOG-001'

async function main() {
  const sucursal = await prisma.sucursal.findUniqueOrThrow({
    where: { codigosucursales: SUCURSAL },
    select: { idsucursales: true },
  })

  const existing = await prisma.equipoAutorizado.findFirst({
    where: {
      mac_addressequipos_autorizados: MAC,
      sucursales_idsucursales:        sucursal.idsucursales,
    },
  })

  const equipo = existing
    ? await prisma.equipoAutorizado.update({
        where:  { idequipos_autorizados: existing.idequipos_autorizados },
        data:   { activoequipos_autorizados: true },
      })
    : await prisma.equipoAutorizado.create({
        data: {
          sucursales_idsucursales:              sucursal.idsucursales,
          mac_addressequipos_autorizados:       MAC,
          nombreequipos_autorizados:            'Equipo Cajero Principal',
          sistema_operativoequipos_autorizados: 'macos',
          activoequipos_autorizados:            true,
        },
      })

  console.log(`✓ Equipo registrado`)
  console.log(`  id:       ${equipo.idequipos_autorizados}`)
  console.log(`  mac:      ${equipo.mac_addressequipos_autorizados}`)
  console.log(`  sucursal: ${sucursal.idsucursales} (${SUCURSAL})`)
  console.log(`  activo:   ${equipo.activoequipos_autorizados}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
