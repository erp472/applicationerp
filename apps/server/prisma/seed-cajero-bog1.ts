/**
 * Seed: cajero.bog1@4-72.com.co — CAJERO en Bogotá Norte (SUC-BOG-002)
 *
 * Fuerza IDs específicos (usuario 51, caja 291) para que el JWT de dev
 * pre-existente siga funcionando después de un reset de BD.
 *
 * Idempotente — re-ejecutar es seguro.
 * Ejecutar desde apps/server/:
 *   npx tsx prisma/seed-cajero-bog1.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'
import { hash }        from '@node-rs/bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const TARGET_USER_ID = 51
const TARGET_CAJA_ID = 291
const EMAIL          = 'cajero.bog1@4-72.com.co'
const PASSWORD       = 'Cajero.Bog1.472'
const SUCURSAL_ID    = 2  // Bogotá Norte
const CAJA_PADRE_ID  = 2  // Punto Bogotá Norte

async function setSequence(seqName: string, nextVal: number) {
  await prisma.$executeRawUnsafe(
    `SELECT setval($1, $2)`, seqName, nextVal - 1,
  )
}

async function main() {
  console.log('🌱 Seed cajero.bog1 iniciado…\n')

  const passwordHash = await hash(PASSWORD, 10)

  // ── 1. Usuario en ID exacto ───────────────────────────────────────────────
  const existingUser = await prisma.usuario.findFirst({
    where: { emailusuarios: EMAIL },
  })

  let usuario: { idusuarios: number; emailusuarios: string }

  if (existingUser) {
    usuario = await prisma.usuario.update({
      where:  { idusuarios: existingUser.idusuarios },
      data:   { password_hashusuarios: passwordHash, activousuarios: true },
      select: { idusuarios: true, emailusuarios: true },
    })
    console.log(`✓ Usuario actualizado: ${usuario.emailusuarios} (id=${usuario.idusuarios})`)

    if (usuario.idusuarios !== TARGET_USER_ID) {
      console.log(`⚠  El usuario existe con id=${usuario.idusuarios} en lugar de ${TARGET_USER_ID}.`)
      console.log(`   Necesitas renovar el JWT — login con ${EMAIL} / ${PASSWORD}`)
    }
  } else {
    await setSequence('usuarios_idusuarios_seq', TARGET_USER_ID)
    usuario = await prisma.usuario.create({
      data: {
        sucursales_idsucursales: SUCURSAL_ID,
        roles_idroles:           4, // CAJERO
        nombreusuarios:          'Cajero Bogotá 1',
        emailusuarios:           EMAIL,
        password_hashusuarios:   passwordHash,
        activousuarios:          true,
      },
      select: { idusuarios: true, emailusuarios: true },
    })
    console.log(`✓ Usuario creado: ${usuario.emailusuarios} (id=${usuario.idusuarios})`)
    if (usuario.idusuarios !== TARGET_USER_ID) {
      console.warn(`⚠  Advertencia: id=${usuario.idusuarios} ≠ ${TARGET_USER_ID} (secuencia ya superada)`)
    }
  }

  // ── 2. Caja en ID exacto ──────────────────────────────────────────────────
  const existingCaja = await prisma.caja.findFirst({
    where: { idcajas: TARGET_CAJA_ID },
  })

  let caja: { idcajas: number; nombrecajas: string }

  if (existingCaja) {
    caja = await prisma.caja.update({
      where:  { idcajas: existingCaja.idcajas },
      data:   { activocajas: true },
      select: { idcajas: true, nombrecajas: true },
    })
    console.log(`✓ Caja existente: ${caja.nombrecajas} (id=${caja.idcajas})`)

    if (caja.idcajas !== TARGET_CAJA_ID) {
      console.log(`⚠  La caja existe con id=${caja.idcajas} en lugar de ${TARGET_CAJA_ID}.`)
      console.log(`   Usa /ventas/punto/${caja.idcajas}/resumen en el frontend.`)
    }
  } else {
    await setSequence('cajas_idcajas_seq', TARGET_CAJA_ID)
    caja = await prisma.caja.create({
      data: {
        sucursales_idsucursales:         SUCURSAL_ID,
        cajas_padres_idcajas_padres:     CAJA_PADRE_ID,
        codigocajas:                     'POS-BOG-002-02',
        nombrecajas:                     'POS 2 — Bog Norte',
        tipocajas:                       'pos',
        base_diacajas:                   500_000,
        limite_alertacajas:              100_000,
        activocajas:                     true,
        usuarios_idusuarios_cajero_fijo: TARGET_USER_ID,
      },
      select: { idcajas: true, nombrecajas: true },
    })
    console.log(`✓ Caja creada: ${caja.nombrecajas} (id=${caja.idcajas})`)
    if (caja.idcajas !== TARGET_CAJA_ID) {
      console.warn(`⚠  Advertencia: id=${caja.idcajas} ≠ ${TARGET_CAJA_ID} (secuencia ya superada)`)
    }
  }

  // ── 3. Sesión abierta ─────────────────────────────────────────────────────
  const sesionExistente = await prisma.sesionCaja.findFirst({
    where: { cajas_idcajas: caja.idcajas, estadosesiones_caja: 'abierta' },
  })

  if (sesionExistente) {
    // Asegurar cajeroAsignadoUid explícito para evitar doble sesión por aperturaUid
    if (!sesionExistente.usuarios_idusuarios_cajero_asignado) {
      await prisma.sesionCaja.update({
        where: { idsesiones_caja: sesionExistente.idsesiones_caja },
        data:  { usuarios_idusuarios_cajero_asignado: usuario.idusuarios },
      })
    }
    console.log(`✓ Sesión ya abierta (id=${sesionExistente.idsesiones_caja}) en caja ${caja.idcajas}`)
  } else {
    const sesion = await prisma.sesionCaja.create({
      data: {
        cajas_idcajas:                       caja.idcajas,
        usuarios_idusuarios_apertura:        usuario.idusuarios,
        usuarios_idusuarios_cajero_asignado: usuario.idusuarios,
        monto_aperturasesiones_caja:         500_000,
        estadosesiones_caja:                 'abierta',
        observacionessesiones_caja:          'Apertura seed-cajero-bog1.ts',
      },
    })
    await prisma.movimientoCaja.create({
      data: {
        sesiones_caja_idsesiones_caja: sesion.idsesiones_caja,
        tipomovimientos_caja:          'apertura',
        montomovimientos_caja:         500_000,
        descripcionmovimientos_caja:   'Apertura seed cajero.bog1',
      },
    })
    console.log(`✓ Sesión abierta (id=${sesion.idsesiones_caja}) — monto: $500.000`)
  }

  console.log('\n✅ Seed completado.')
  console.log('━'.repeat(50))
  console.log(`👤 Usuario:   ${EMAIL}`)
  console.log(`🔑 Password:  ${PASSWORD}`)
  console.log(`🏪 Sucursal:  Bogotá Norte (id=${SUCURSAL_ID})`)
  console.log(`🖥  Caja:      ${caja.nombrecajas} (id=${caja.idcajas})`)
  console.log(`\n📌 Si el JWT fue emitido antes del reset, haz login de nuevo para renovarlo.`)
  console.log(`   GET /ventas/punto/${caja.idcajas}/resumen`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
