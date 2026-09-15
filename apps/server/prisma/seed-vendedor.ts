/**
 * Seed: Vendedor de prueba + sesión abierta en POS-BOG-001-01
 *
 * Requisitos para realizar una venta:
 *  1. Usuario CAJERO asignado a la sucursal
 *  2. Caja tipo=pos activa en esa sucursal
 *  3. Sesión abierta (estado=abierta) en esa caja con el cajero como apertura
 *  4. Productos con ProductoSucursal + InventarioSucursal (ya cargados por seed principal)
 *
 * Idempotente — re-ejecutar es seguro.
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-vendedor.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'
import { hash }        from '@node-rs/bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seed vendedor iniciado…\n')

  // ── 1. Rol CAJERO ─────────────────────────────────────────────────────────
  const rolCajero = await prisma.rol.findUniqueOrThrow({
    where: { codigoroles: 'CAJERO' },
  })
  console.log(`✓ Rol encontrado: ${rolCajero.nombreroles} (id=${rolCajero.idroles})`)

  // ── 2. Sucursal principal ─────────────────────────────────────────────────
  const sucursal = await prisma.sucursal.findUniqueOrThrow({
    where: { codigosucursales: 'SUC-BOG-001' },
  })
  console.log(`✓ Sucursal: ${sucursal.nombresucursales} (id=${sucursal.idsucursales})`)

  // ── 3. Crear/actualizar usuario vendedor ──────────────────────────────────
  const passwordHash = await hash('Vendedor.472', 10)

  const vendedor = await prisma.usuario.upsert({
    where:  { emailusuarios: 'vendedor@4-72.com.co' },
    update: {
      // Actualiza hash en cada ejecución por si cambió
      password_hashusuarios:   passwordHash,
      sucursales_idsucursales: sucursal.idsucursales,
      activousuarios:          true,
    },
    create: {
      sucursales_idsucursales: sucursal.idsucursales,
      roles_idroles:           rolCajero.idroles,
      nombreusuarios:          'Vendedor Demo',
      emailusuarios:           'vendedor@4-72.com.co',
      password_hashusuarios:   passwordHash,
      activousuarios:          true,
    },
  })
  console.log(`✓ Usuario: ${vendedor.emailusuarios} (id=${vendedor.idusuarios})`)

  // ── 4. Caja POS del vendedor (POS-BOG-001-02) ────────────────────────────
  // Cada cajero opera su propia caja POS. Creamos una dedicada al vendedor
  // para no colisionar con la sesión activa de POS-BOG-001-01 (cajero seed).
  const cajaPadre = await prisma.cajaPadre.findFirst({
    where: { sucursales_idsucursales: sucursal.idsucursales, deleted_atcajas_padres: null },
  })
  if (!cajaPadre) throw new Error('CajaPadre no encontrada — ejecuta el seed principal primero.')

  const cajaPOS = await prisma.caja.upsert({
    where: {
      codigocajas_sucursales_idsucursales: {
        codigocajas:             'POS-BOG-001-02',
        sucursales_idsucursales: sucursal.idsucursales,
      },
    },
    update: { activocajas: true },
    create: {
      sucursales_idsucursales:     sucursal.idsucursales,
      cajas_padres_idcajas_padres: cajaPadre.idcajas_padres,
      codigocajas:                 'POS-BOG-001-02',
      nombrecajas:                 'POS 2 — Vendedor',
      tipocajas:                   'pos',
      base_diacajas:               500_000,
      limite_alertacajas:          100_000,
      activocajas:                 true,
    },
  })
  console.log(`✓ Caja POS: ${cajaPOS.nombrecajas} (id=${cajaPOS.idcajas})`)

  // ── 5. Sesión abierta ─────────────────────────────────────────────────────
  // Cerrar sesiones huérfanas previas del vendedor en esta caja
  const sesionesHuerfanas = await prisma.sesionCaja.findMany({
    where: {
      cajas_idcajas:               cajaPOS.idcajas,
      estadosesiones_caja:         'abierta',
      usuarios_idusuarios_apertura: vendedor.idusuarios,
    },
  })

  if (sesionesHuerfanas.length === 0) {
    // Verificar que no haya otra sesión abierta en esta caja (de otro usuario)
    const sesionExistente = await prisma.sesionCaja.findFirst({
      where: {
        cajas_idcajas:       cajaPOS.idcajas,
        estadosesiones_caja: 'abierta',
      },
    })

    if (sesionExistente) {
      console.log(`⚠  Ya existe una sesión abierta (id=${sesionExistente.idsesiones_caja}) en POS-BOG-001-01.`)
      console.log(`   Usuario apertura: ${sesionExistente.usuarios_idusuarios_apertura}`)
      console.log('   Usa esa sesión o ciérrala desde el panel antes de abrir una nueva.')
    } else {
      const sesion = await prisma.sesionCaja.create({
        data: {
          cajas_idcajas:               cajaPOS.idcajas,
          usuarios_idusuarios_apertura: vendedor.idusuarios,
          monto_aperturasesiones_caja:  500_000,  // base día de prueba
          estadosesiones_caja:          'abierta',
          observacionessesiones_caja:   'Sesión aperturada por seed-vendedor.ts',
        },
      })

      // Movimiento de apertura
      await prisma.movimientoCaja.create({
        data: {
          sesiones_caja_idsesiones_caja: sesion.idsesiones_caja,
          tipomovimientos_caja:          'apertura',
          montomovimientos_caja:         500_000,
          descripcionmovimientos_caja:   'Apertura seed vendedor',
        },
      })

      console.log(`✓ Sesión abierta (id=${sesion.idsesiones_caja}) — monto apertura: $500.000`)
    }
  } else {
    console.log(`✓ Sesión ya existente (id=${sesionesHuerfanas[0].idsesiones_caja}) — no se crea duplicado.`)
  }

  // ── 6. Verificar productos disponibles ────────────────────────────────────
  const productosCount = await prisma.productoSucursal.count({
    where: {
      sucursales_idsucursales: sucursal.idsucursales,
      activoproductos_sucursal: true,
      producto: { activoproductos: true },
    },
  })
  const stockCount = await prisma.inventarioSucursal.count({
    where: {
      sucursales_idsucursales: sucursal.idsucursales,
      cantidad_actualinventario_sucursal: { gt: 0 },
    },
  })
  console.log(`✓ Productos disponibles en sucursal: ${productosCount} (con stock: ${stockCount})`)

  console.log('\n✅ Seed vendedor completado.')
  console.log('━'.repeat(50))
  console.log(`👤 Vendedor:  ${vendedor.emailusuarios}`)
  console.log(`🔑 Password:  Vendedor.472`)
  console.log(`🏪 Sucursal:  ${sucursal.nombresucursales} (id=${sucursal.idsucursales})`)
  console.log(`🖥  Caja POS:  ${cajaPOS.nombrecajas} (id=${cajaPOS.idcajas})`)
  console.log('\nFlujo de venta:')
  console.log(`  1. Login como vendedor@4-72.com.co / Vendedor.472`)
  console.log(`  2. Ir a /ventas (app Tauri)`)
  console.log(`  3. Seleccionar caja POS id=${cajaPOS.idcajas}`)
  console.log(`  4. Iniciar venta POST /ventas/punto/${cajaPOS.idcajas}/iniciar`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
