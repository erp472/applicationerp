/**
 * Seed: Prepara todos los datos necesarios para ventas de prueba
 *
 *  - Fondea la caja del vendedor con reposición ($2.000.000 adicionales)
 *  - Asegura stock suficiente en todos los productos de la sucursal
 *  - Garantiza clientes de prueba con distintos tipos de documento
 *  - Imprime la tabla de referencia y el flujo completo de venta
 *
 * Idempotente. Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-datos-venta.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg }    from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const SUCURSAL_ID = 1
const SESION_ID   = 6   // sesión abierta del vendedor
const CAJA_ID     = 11  // POS-BOG-001-02
const USUARIO_ID  = 6   // vendedor@4-72.com.co

// ── Helpers ───────────────────────────────────────────────────────────────────

const COP = (n: number) => `$${n.toLocaleString('es-CO')}`
const pad  = (s: string | number, w: number) => String(s).padEnd(w)

async function main() {
  console.log('═'.repeat(60))
  console.log('  SETUP DATOS DE VENTA — 4-72 POS')
  console.log('═'.repeat(60))

  // ── 1. Verificar sesión ───────────────────────────────────────────────────
  const sesion = await prisma.sesionCaja.findUniqueOrThrow({
    where:   { idsesiones_caja: SESION_ID },
    include: { caja: true, usuarioApertura: { select: { emailusuarios: true, nombreusuarios: true } } },
  })

  if (sesion.estadosesiones_caja !== 'abierta') {
    throw new Error(`Sesión ${SESION_ID} no está abierta (estado: ${sesion.estadosesiones_caja}). Ejecuta seed-vendedor.ts primero.`)
  }
  console.log(`\n✓ Sesión ${SESION_ID} abierta — ${sesion.usuarioApertura.emailusuarios}`)
  console.log(`  Caja: ${sesion.caja.codigocajas} (id=${sesion.caja.idcajas})`)

  // ── 2. Fondear caja (reposición) ──────────────────────────────────────────
  const reposicionesExistentes = await prisma.movimientoCaja.count({
    where: {
      sesiones_caja_idsesiones_caja: SESION_ID,
      tipomovimientos_caja:          'reposicion',
      descripcionmovimientos_caja:   'Fondeo seed para pruebas',
    },
  })

  if (reposicionesExistentes === 0) {
    await prisma.movimientoCaja.create({
      data: {
        sesiones_caja_idsesiones_caja: SESION_ID,
        tipomovimientos_caja:          'reposicion',
        montomovimientos_caja:         2_000_000,
        descripcionmovimientos_caja:   'Fondeo seed para pruebas',
      },
    })
    console.log(`✓ Reposición +${COP(2_000_000)} agregada a sesión`)
  } else {
    console.log(`✓ Reposición ya existía — no se duplica`)
  }

  // Calcular saldo actual
  const movs = await prisma.movimientoCaja.findMany({
    where:  { sesiones_caja_idsesiones_caja: SESION_ID },
    select: { tipomovimientos_caja: true, montomovimientos_caja: true },
  })
  const ENTRADA = new Set(['reposicion', 'venta_producto', 'venta_servicio', 'venta_estampilla', 'apartado_postal', 'giro_emision_cobro', 'recaudo', 'cambio_custodia_in', 'diferencia_sobrante', 'moneda_circulante'])
  const SALIDA  = new Set(['consignacion', 'giro_pago', 'pago_administrativo', 'anulacion', 'cambio_custodia_out', 'diferencia_faltante'])
  let saldo = Number(sesion.monto_aperturasesiones_caja)
  for (const m of movs) {
    const monto = Number(m.montomovimientos_caja)
    if (ENTRADA.has(m.tipomovimientos_caja)) saldo += monto
    else if (SALIDA.has(m.tipomovimientos_caja)) saldo -= monto
  }
  console.log(`  Saldo actual: ${COP(saldo)}`)

  // ── 3. Stock de productos ─────────────────────────────────────────────────
  const TARGET_STOCK = 500

  const prods = await prisma.producto.findMany({
    where: {
      activoproductos:     true,
      deleted_atproductos: null,
      productosSucursal:   { some: { sucursales_idsucursales: SUCURSAL_ID, activoproductos_sucursal: true } },
    },
    select: {
      idproductos:     true,
      codigoproductos: true,
      nombreproductos: true,
      tipoproductos:   true,
      precioproductos: true,
      inventarioSucursal: {
        where:  { sucursales_idsucursales: SUCURSAL_ID },
        select: { cantidad_actualinventario_sucursal: true },
      },
    },
    orderBy: [{ tipoproductos: 'asc' }, { nombreproductos: 'asc' }],
  })

  let stockCreados = 0
  let stockActualizados = 0

  for (const p of prods) {
    // Solo controlar stock para tipos físicos (no servicios especiales)
    if (['otro'].includes(p.tipoproductos)) continue

    const existente = p.inventarioSucursal[0]

    if (!existente) {
      await prisma.inventarioSucursal.create({
        data: {
          sucursales_idsucursales:            SUCURSAL_ID,
          productos_idproductos:              p.idproductos,
          cantidad_actualinventario_sucursal: TARGET_STOCK,
          cantidad_minimainventario_sucursal: 10,
        },
      })
      // Movimiento de entrada para trazabilidad
      await prisma.movimientoInventario.create({
        data: {
          sucursales_idsucursales:                  SUCURSAL_ID,
          productos_idproductos:                    p.idproductos,
          tipomovimientos_inventario:               'entrada',
          cantidadmovimientos_inventario:           TARGET_STOCK,
          cantidad_anteriormovimientos_inventario:  0,
          cantidad_posteriormovimientos_inventario: TARGET_STOCK,
          referencia_tipomovimientos_inventario:    'SeedDatosVenta',
          usuarios_idusuarios:                      USUARIO_ID,
          observacionmovimientos_inventario:        'Stock inicial cargado por seed-datos-venta.ts',
        },
      })
      stockCreados++
    } else if (existente.cantidad_actualinventario_sucursal < 50) {
      const anterior = existente.cantidad_actualinventario_sucursal
      await prisma.inventarioSucursal.update({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: SUCURSAL_ID,
            productos_idproductos:   p.idproductos,
          },
        },
        data: { cantidad_actualinventario_sucursal: TARGET_STOCK },
      })
      await prisma.movimientoInventario.create({
        data: {
          sucursales_idsucursales:                  SUCURSAL_ID,
          productos_idproductos:                    p.idproductos,
          tipomovimientos_inventario:               'ajuste',
          cantidadmovimientos_inventario:           TARGET_STOCK - anterior,
          cantidad_anteriormovimientos_inventario:  anterior,
          cantidad_posteriormovimientos_inventario: TARGET_STOCK,
          referencia_tipomovimientos_inventario:    'SeedDatosVenta',
          usuarios_idusuarios:                      USUARIO_ID,
          observacionmovimientos_inventario:        'Reposición stock por seed-datos-venta.ts',
        },
      })
      stockActualizados++
    }
  }
  console.log(`\n✓ Stock: ${stockCreados} productos creados, ${stockActualizados} reabastecidos a ${TARGET_STOCK} unidades`)

  // ── 4. Clientes de prueba ─────────────────────────────────────────────────
  const tipoGeneralCliente = await prisma.tipoCliente.findFirst({
    where: { codigotipos_cliente: 'GENERAL' },
  })

  const clientesData = [
    { tipo: 'cedula',            numero: '12345678',   nombre: 'Juan',     apellido: 'García',    email: 'juan.garcia@email.com',    tel: '3001234567' },
    { tipo: 'cedula',            numero: '87654321',   nombre: 'María',    apellido: 'López',     email: 'maria.lopez@email.com',    tel: '3107654321' },
    { tipo: 'nit',               numero: '900123456',  nombre: 'Empresa',  apellido: 'ABC SAS',   email: 'empresa@abc.com',          tel: '6017000000' },
    { tipo: 'tarjeta_identidad', numero: '1012345678', nombre: 'Sofía',    apellido: 'Martínez',  email: 'sofia.martinez@email.com', tel: '3201112233' },
    { tipo: 'pasaporte',         numero: 'PA1234567',  nombre: 'John',     apellido: 'Smith',     email: 'john.smith@email.com',     tel: '3009998877' },
    { tipo: 'cedula',            numero: '10000001',   nombre: 'Carlos',   apellido: 'Rodríguez', email: 'carlos.rodriguez@test.com',tel: '3112223344' },
    { tipo: 'cedula',            numero: '10000002',   nombre: 'Ana',      apellido: 'Gómez',     email: 'ana.gomez@test.com',       tel: '3123334455' },
  ] as const

  let clientesCreados = 0
  for (const c of clientesData) {
    const existe = await prisma.cliente.findFirst({
      where: { tipo_documentoclientes: c.tipo as any, numero_documentoclientes: c.numero, deleted_atclientes: null },
    })
    if (!existe) {
      await prisma.cliente.create({
        data: {
          tipo_documentoclientes:           c.tipo as any,
          numero_documentoclientes:         c.numero,
          nombreclientes:                   c.nombre,
          apellidoclientes:                 c.apellido,
          emailclientes:                    c.email,
          telefonoclientes:                 c.tel,
          tipos_cliente_idtipos_cliente:    tipoGeneralCliente?.idtipos_cliente ?? null,
          activoclientes:                   true,
        },
      })
      clientesCreados++
    }
  }
  console.log(`✓ Clientes: ${clientesCreados} creados (${clientesData.length - clientesCreados} ya existían)`)

  // ── 5. Apartados postales ─────────────────────────────────────────────────
  const apartadosData = [
    { numero: '100001', tamano: 'pequeno'  as const },
    { numero: '100002', tamano: 'pequeno'  as const },
    { numero: '100003', tamano: 'mediano'  as const },
    { numero: '100004', tamano: 'grande'   as const },
  ]

  let apartadosCreados = 0
  for (const a of apartadosData) {
    const existe = await prisma.apartadoPostal.findUnique({
      where: {
        sucursales_idsucursales_numeroapartados_postales: {
          sucursales_idsucursales:  SUCURSAL_ID,
          numeroapartados_postales: a.numero,
        },
      },
    })
    if (!existe) {
      await prisma.apartadoPostal.create({
        data: {
          sucursales_idsucursales:                   SUCURSAL_ID,
          numeroapartados_postales:                  a.numero,
          tamanoapartados_postales:                  a.tamano,
          estadoapartados_postales:                  'disponible',
          dias_alerta_vencimientoapartados_postales: 30,
        },
      })
      apartadosCreados++
    }
  }
  console.log(`✓ Apartados postales: ${apartadosCreados} creados (${apartadosData.length - apartadosCreados} ya existían)`)

  // ── 6. Estado final ───────────────────────────────────────────────────────

  const prodsFinales = await prisma.producto.findMany({
    where: {
      activoproductos:     true,
      deleted_atproductos: null,
      tipoproductos:       { notIn: ['otro'] },
      productosSucursal:   { some: { sucursales_idsucursales: SUCURSAL_ID, activoproductos_sucursal: true } },
    },
    select: {
      idproductos:     true,
      codigoproductos: true,
      nombreproductos: true,
      tipoproductos:   true,
      precioproductos: true,
      porcentaje_taxproductos: true,
      inventarioSucursal: {
        where:  { sucursales_idsucursales: SUCURSAL_ID },
        select: { cantidad_actualinventario_sucursal: true },
      },
    },
    orderBy: [{ tipoproductos: 'asc' }, { precioproductos: 'asc' }],
  })

  console.log('\n' + '═'.repeat(60))
  console.log('  CATÁLOGO DE PRUEBA — SUCURSAL Bogotá Centro (id=1)')
  console.log('═'.repeat(60))
  console.log(pad('ID', 5) + pad('TIPO', 14) + pad('CÓDIGO', 20) + pad('PRECIO', 10) + pad('STOCK', 7) + 'NOMBRE')
  console.log('─'.repeat(80))

  for (const p of prodsFinales) {
    const stock = p.inventarioSucursal[0]?.cantidad_actualinventario_sucursal ?? '—'
    const precio = `$${Number(p.precioproductos).toLocaleString('es-CO')}`
    console.log(pad(p.idproductos, 5) + pad(p.tipoproductos, 14) + pad(p.codigoproductos, 20) + pad(precio, 10) + pad(stock, 7) + p.nombreproductos)
  }

  console.log('\n' + '─'.repeat(60))
  console.log('  CLIENTES DISPONIBLES')
  console.log('─'.repeat(60))
  const clientes = await prisma.cliente.findMany({ where: { deleted_atclientes: null, activoclientes: true }, orderBy: { idclientes: 'asc' } })
  for (const c of clientes) {
    console.log(`  [${c.idclientes}] ${c.tipo_documentoclientes.padEnd(20)} ${c.numero_documentoclientes.padEnd(12)} ${c.nombreclientes} ${c.apellidoclientes ?? ''}`)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('  RESUMEN DE LA SESIÓN')
  console.log('═'.repeat(60))
  console.log(`  Vendedor:    vendedor@4-72.com.co  (id=${USUARIO_ID})`)
  console.log(`  Contraseña:  Vendedor.472`)
  console.log(`  Sucursal:    Bogotá Centro         (id=${SUCURSAL_ID})`)
  console.log(`  Caja POS:    POS-BOG-001-02        (id=${CAJA_ID})`)
  console.log(`  Sesión:      id=${SESION_ID}  estado=abierta`)
  console.log(`  Saldo:       ${COP(saldo)}`)

  console.log('\n' + '═'.repeat(60))
  console.log('  FLUJO COMPLETO DE VENTA (endpoints)')
  console.log('═'.repeat(60))
  console.log(`
  BASE: http://localhost:3000
  AUTH: Authorization: Bearer <jwt>

  ① INICIAR VENTA
  POST /ventas/punto/${CAJA_ID}/iniciar
  {
    "tipoDocumento":   "cedula",
    "numeroDocumento": "12345678"
  }
  → Devuelve: { venta: { id: <ventaId> }, cliente: {...} }

  ② AGREGAR PRODUCTO (repetir para cada ítem)
  POST /ventas/<ventaId>/producto?cajaId=${CAJA_ID}
  { "productoId": 1, "cantidad": 5, "descuento": 0 }
  → ids útiles: 1=EST-20($20) | 2=EST-50($50) | 3=EST-100($100)
               7=EMP-CAJA-P($1.500) | 8=EMP-CAJA-M($2.500) | 9=EMP-CAJA-G($3.500)

  ③ VER CARRITO
  GET /ventas/<ventaId>/carrito?cajaId=${CAJA_ID}
  → Muestra items, subtotal, IVA y total

  ④ CONFIRMAR VENTA (pago en efectivo)
  POST /ventas/<ventaId>/confirmar?cajaId=${CAJA_ID}
  {
    "medioPago":        "efectivo",
    "efectivoRecibido": 5000,
    "emailFactura":     "juan.garcia@email.com"
  }
  → Devuelve: { venta, cambio, saldoActual, alertas }

  ④ CONFIRMAR VENTA (pago electrónico)
  POST /ventas/<ventaId>/confirmar?cajaId=${CAJA_ID}
  {
    "medioPago":    "transferencia",
    "emailFactura": "juan.garcia@email.com"
  }

  ⑤ ANULAR VENTA (si es necesario)
  POST /ventas/<ventaId>/anular?cajaId=${CAJA_ID}
  { "motivo": "Error en el pedido" }

  ⑥ RESUMEN DEL TURNO
  GET /ventas/turno/resumen?cajaId=${CAJA_ID}

  MEDIOS DE PAGO válidos:
    efectivo | tarjeta_debito | tarjeta_credito | transferencia | nequi | daviplata
`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
