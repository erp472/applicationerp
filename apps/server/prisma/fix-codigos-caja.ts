/**
 * fix-codigos-caja.ts
 * Asigna códigos únicos de 4 dígitos a TODAS las cajas de tipo 'pos'.
 * Los códigos son secuenciales, zero-padded: 0001, 0002, ..., 9999.
 *
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/fix-codigos-caja.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

async function main() {
  // 1. Obtener TODAS las cajas POS activas, ordenadas por sucursal e ID
  const cajas = await prisma.caja.findMany({
    where: {
      tipocajas:      'pos',
      deleted_atcajas: null,
    },
    orderBy: [
      { sucursales_idsucursales: 'asc' },
      { idcajas: 'asc' },
    ],
    select: {
      idcajas:                    true,
      codigocajas:                true,
      nombrecajas:                true,
      sucursales_idsucursales:    true,
      sucursal: { select: { nombresucursales: true } },
    },
  })

  console.log(`\n📦  ${cajas.length} cajas POS encontradas\n`)

  if (cajas.length > 9999) {
    throw new Error('Más de 9999 cajas — el rango de 4 dígitos no alcanza.')
  }

  // 2. Generar códigos únicos globales de 4 dígitos (0001-9999, sin colisión)
  const usados = new Set<string>()
  let counter  = 1

  function siguienteCodigo(): string {
    while (usados.has(String(counter).padStart(4, '0'))) counter++
    const cod = String(counter).padStart(4, '0')
    usados.add(cod)
    counter++
    return cod
  }

  // 3. Reservar temp-codes para evitar conflictos de unique durante la transición
  //    (el unique es por [codigo, sucursal_id], así que usamos un prefijo temporal)
  const TEMP = 'TMP-'
  console.log('  → Paso 1/2: asignando códigos temporales...')
  for (const caja of cajas) {
    await prisma.caja.update({
      where: { idcajas: caja.idcajas },
      data:  { codigocajas: `${TEMP}${caja.idcajas}` },
    })
  }

  // 4. Asignar los códigos definitivos de 4 dígitos
  console.log('  → Paso 2/2: asignando códigos definitivos...\n')
  for (const caja of cajas) {
    const nuevoCodigo = siguienteCodigo()
    await prisma.caja.update({
      where: { idcajas: caja.idcajas },
      data:  { codigocajas: nuevoCodigo },
    })
    console.log(
      `  ✓ [${String(caja.idcajas).padStart(5)}]`
      + `  ${caja.sucursal.nombresucursales.padEnd(30)}`
      + `  ${caja.nombrecajas.padEnd(12)}`
      + `  ${caja.codigocajas.padEnd(12)} → ${nuevoCodigo}`,
    )
  }

  console.log(`\n✅  ${cajas.length} cajas actualizadas con códigos únicos de 4 dígitos (0001–${String(cajas.length).padStart(4, '0')})\n`)
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect().then(() => pool.end()))
