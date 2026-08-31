/**
 * Seed: Equipo completo de desarrollo — usuarios y sesiones de caja
 *
 * Política: Los passwords son INMUTABLES después de la creación.
 * Este seed solo hace CREATE si el usuario no existe — nunca UPDATE al password.
 * La excepción es cajero.bog1 que fue creado con contraseña incorrecta; se corrige una sola vez.
 *
 * Ejecutar desde apps/server/:
 *   npx tsx prisma/seed-equipo-dev.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'
import { hash }        from '@node-rs/bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

// ── Tabla canónica de credenciales ────────────────────────────────────────────
// Estas credenciales son INMUTABLES. No cambiar.
const USUARIOS = [
  {
    email:     'supervisor.a@4-72.com.co',
    nombre:    'Supervisor Punto A',
    password:  'Super@2024',
    rolCodigo: 'SUPERVISOR_REGIONAL',
    sucursal:  'SUC-BOG-001',     // Bogotá Centro
    esSupervisor: true,
  },
  {
    email:     'supervisor.b@4-72.com.co',
    nombre:    'Supervisor Punto B',
    password:  'Super@2024',
    rolCodigo: 'SUPERVISOR_REGIONAL',
    sucursal:  'SUC-BOG-002',     // Bogotá Norte
    esSupervisor: true,
  },
  {
    email:     'cajero.bog1@4-72.com.co',
    nombre:    'Cajero Bogotá 1',
    password:  'Cajero@2024',
    rolCodigo: 'CAJERO',
    sucursal:  'SUC-BOG-002',     // Bogotá Norte — ID 51 forzado por JWT de dev
    cajaCodigo: 'POS-BOG-002-02', // Caja 291 ya creada por seed-cajero-bog1
    fixPassword: true,            // Corrección única: password incorrecto en seed anterior
  },
  {
    email:     'cajero.bog2@4-72.com.co',
    nombre:    'Cajero Bogotá 2',
    password:  'Cajero@2024',
    rolCodigo: 'CAJERO',
    sucursal:  'SUC-BOG-002',
    cajaCodigo: 'POS-BOG-002-01', // caja real Bogotá Norte (id=6)
  },
  {
    email:     'cajero.bog3@4-72.com.co',
    nombre:    'Cajero Bogotá 3',
    password:  'Cajero@2024',
    rolCodigo: 'CAJERO',
    sucursal:  'SUC-BOG-001',
    cajaCodigo: 'POS-BOG-001-01', // caja real Bogotá Centro (id=2)
  },
  {
    email:     'cajero.bog4@4-72.com.co',
    nombre:    'Cajero Bogotá 4',
    password:  'Cajero@2024',
    rolCodigo: 'CAJERO',
    sucursal:  'SUC-BOG-001',
    cajaCodigo: 'POS-BOG-001-02', // caja real Bogotá Centro (id=11)
  },
]

async function main() {
  console.log('🌱 Seed equipo-dev iniciado…\n')

  // Pre-cargar roles y sucursales
  const roles     = await prisma.rol.findMany({ select: { idroles: true, codigoroles: true } })
  const sucursales = await prisma.sucursal.findMany({ select: { idsucursales: true, codigosucursales: true } })
  const cajasPadres = await prisma.cajaPadre.findMany({
    where:  { deleted_atcajas_padres: null },
    select: { idcajas_padres: true, sucursales_idsucursales: true },
  })

  const rolPorCodigo   = (c: string) => roles.find(r => r.codigoroles === c)!
  const sucPorCodigo   = (c: string) => sucursales.find(s => s.codigosucursales === c)!
  const padreporSucId  = (id: number) => cajasPadres.find(p => p.sucursales_idsucursales === id)!

  console.log('━'.repeat(55))
  console.log('  USUARIOS')
  console.log('━'.repeat(55))

  for (const u of USUARIOS) {
    const rol      = rolPorCodigo(u.rolCodigo)
    const sucursal = sucPorCodigo(u.sucursal)

    const existe = await prisma.usuario.findFirst({ where: { emailusuarios: u.email } })

    let usuario: { idusuarios: number; emailusuarios: string }

    if (existe) {
      // Política: NO actualizar password salvo corrección explícita (fixPassword)
      if (u.fixPassword) {
        const passwordHash = await hash(u.password, 10)
        usuario = await prisma.usuario.update({
          where:  { idusuarios: existe.idusuarios },
          data:   { password_hashusuarios: passwordHash, activousuarios: true },
          select: { idusuarios: true, emailusuarios: true },
        })
        console.log(`🔧 ${usuario.emailusuarios} (id=${usuario.idusuarios}) — password corregido`)
      } else {
        usuario = { idusuarios: existe.idusuarios, emailusuarios: existe.emailusuarios }
        console.log(`✓  ${usuario.emailusuarios} (id=${usuario.idusuarios}) — ya existe, sin cambios`)
      }
    } else {
      const passwordHash = await hash(u.password, 10)
      usuario = await prisma.usuario.create({
        data: {
          sucursales_idsucursales: sucursal.idsucursales,
          roles_idroles:           rol.idroles,
          nombreusuarios:          u.nombre,
          emailusuarios:           u.email,
          password_hashusuarios:   passwordHash,
          activousuarios:          true,
        },
        select: { idusuarios: true, emailusuarios: true },
      })
      console.log(`+  ${usuario.emailusuarios} (id=${usuario.idusuarios}) — creado`)
    }

    // Supervisores: asegurar que están asignados al CajaPadre de su sucursal
    if (u.esSupervisor) {
      const cajaPadre = padreporSucId(sucursal.idsucursales)
      if (cajaPadre) {
        await prisma.cajaPadre.update({
          where: { idcajas_padres: cajaPadre.idcajas_padres },
          data:  { usuarios_idusuarios_supervisor: usuario.idusuarios },
        })
        console.log(`   → Supervisor asignado al punto (cajaPadre id=${cajaPadre.idcajas_padres})`)
      }
    }

    // Cajeros: asegurar caja POS y sesión abierta
    if (u.cajaCodigo) {
      const cajaPadre = padreporSucId(sucursal.idsucursales)

      let caja = await prisma.caja.findFirst({
        where: { codigocajas: u.cajaCodigo, sucursales_idsucursales: sucursal.idsucursales },
        select: { idcajas: true, nombrecajas: true },
      })

      if (!caja) {
        const num = u.cajaCodigo.split('-').pop()!  // "02", "03", etc.
        caja = await prisma.caja.create({
          data: {
            sucursales_idsucursales:          sucursal.idsucursales,
            cajas_padres_idcajas_padres:      cajaPadre.idcajas_padres,
            codigocajas:                      u.cajaCodigo,
            nombrecajas:                      `POS ${num} — ${sucursal.codigosucursales}`,
            tipocajas:                        'pos',
            base_diacajas:                    500_000,
            limite_alertacajas:               100_000,
            activocajas:                      true,
            usuarios_idusuarios_cajero_fijo:  usuario.idusuarios,
          },
          select: { idcajas: true, nombrecajas: true },
        })
        console.log(`   + Caja ${u.cajaCodigo} creada (id=${caja.idcajas}) cajeroFijo=${usuario.idusuarios}`)
      } else {
        // Asegurar que cajeroFijo esté actualizado aunque la caja ya existía
        await prisma.caja.update({
          where: { idcajas: caja.idcajas },
          data:  { usuarios_idusuarios_cajero_fijo: usuario.idusuarios },
        })
        console.log(`   ✓ Caja ${u.cajaCodigo} (id=${caja.idcajas}) cajeroFijo=${usuario.idusuarios}`)
      }

      // Cerrar sesión abierta del usuario en OTRA caja (evita cajero con dos POS)
      const sesionOtraCaja = await prisma.sesionCaja.findFirst({
        where: {
          estadosesiones_caja: 'abierta',
          cajas_idcajas: { not: caja.idcajas },
          OR: [
            { usuarios_idusuarios_cajero_asignado: usuario.idusuarios },
            { usuarios_idusuarios_cajero_asignado: null, usuarios_idusuarios_apertura: usuario.idusuarios },
          ],
        },
        select: { idsesiones_caja: true, cajas_idcajas: true },
      })
      if (sesionOtraCaja) {
        const saldoAgg = await prisma.movimientoCaja.aggregate({
          where: { sesiones_caja_idsesiones_caja: sesionOtraCaja.idsesiones_caja },
          _sum: { montomovimientos_caja: true },
        })
        await prisma.sesionCaja.update({
          where: { idsesiones_caja: sesionOtraCaja.idsesiones_caja },
          data: {
            estadosesiones_caja:       'cerrada',
            fecha_cierrasesiones_caja: new Date(),
            monto_cierrasesiones_caja: String(Number(saldoAgg._sum.montomovimientos_caja ?? 0)),
            observacionessesiones_caja: 'Cierre automático seed — cajero reasignado a otra caja',
          },
        })
        console.log(`   ⚠ Sesión ${sesionOtraCaja.idsesiones_caja} (caja ${sesionOtraCaja.cajas_idcajas}) cerrada — cajero reasignado`)
      }

      // Abrir sesión si no hay una activa en la caja correcta
      const sesionActiva = await prisma.sesionCaja.findFirst({
        where: { cajas_idcajas: caja.idcajas, estadosesiones_caja: 'abierta' },
      })

      if (!sesionActiva) {
        const sesion = await prisma.sesionCaja.create({
          data: {
            cajas_idcajas:                          caja.idcajas,
            usuarios_idusuarios_apertura:           usuario.idusuarios,
            usuarios_idusuarios_cajero_asignado:    usuario.idusuarios,  // cajero fijo = quien trabaja la caja
            monto_aperturasesiones_caja:            500_000,
            estadosesiones_caja:                    'abierta',
            observacionessesiones_caja:             'Apertura seed-equipo-dev.ts',
          },
        })
        await prisma.movimientoCaja.create({
          data: {
            sesiones_caja_idsesiones_caja: sesion.idsesiones_caja,
            tipomovimientos_caja:          'apertura',
            montomovimientos_caja:         500_000,
            descripcionmovimientos_caja:   'Apertura seed equipo dev',
          },
        })
        console.log(`   + Sesión ${sesion.idsesiones_caja} abierta en caja ${caja.idcajas}`)
      } else {
        // Asegura que cajeroAsignadoUid esté explícito en sesiones existentes
        if (!sesionActiva.usuarios_idusuarios_cajero_asignado) {
          await prisma.sesionCaja.update({
            where: { idsesiones_caja: sesionActiva.idsesiones_caja },
            data:  { usuarios_idusuarios_cajero_asignado: usuario.idusuarios },
          })
        }
        console.log(`   ✓ Sesión ${sesionActiva.idsesiones_caja} ya abierta en caja ${caja.idcajas}`)
      }
    }
  }

  console.log('\n━'.repeat(55))
  console.log('  RESUMEN DE ACCESO')
  console.log('━'.repeat(55))
  console.log(
    '│ ' + 'Usuario'.padEnd(20) + '│ ' + 'Email'.padEnd(30) + '│ ' + 'Password'.padEnd(14) + '│',
  )
  console.log('│' + '─'.repeat(21) + '│' + '─'.repeat(31) + '│' + '─'.repeat(15) + '│')
  for (const u of USUARIOS) {
    const nombre = u.nombre.padEnd(20)
    const email  = u.email.padEnd(30)
    const pass   = u.password.padEnd(14)
    console.log(`│ ${nombre}│ ${email}│ ${pass}│`)
  }
  console.log('\n✅ Seed equipo-dev completado.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
