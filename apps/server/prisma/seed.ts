import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from '@node-rs/bcrypt'
import { seedGeo } from './seed-geo.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Geo IDs extraídos del JSON countries-master (Colombia id=82)
const GEO = {
  colombia:      82,
  cundinamarca:  1726,
  antioquia:     1700,
  bogota:        452468,
  medellin:      465167,
}

async function main() {
  console.log('🌱 Iniciando seed...')

  // ── 0. GEO ────────────────────────────────────────────────────────────────
  await seedGeo(prisma)
  console.log('✓ Geo')

  // ── 1. COMERCIO ───────────────────────────────────────────────────────────
  const comercio = await prisma.comercio.upsert({
    where: { codigocomercios: '4-72' },
    update: {},
    create: {
      codigocomercios: '4-72',
      nombrecomercios: 'Servicios Postales Nacionales S.A.',
      nitcomercios: '830113400-3',
      activocomercios: true,
    },
  })
  console.log(`✓ Comercio: ${comercio.nombrecomercios}`)

  // ── 2. REGIONALES ─────────────────────────────────────────────────────────
  const [regBogota, regMedellin] = await Promise.all([
    prisma.regional.upsert({
      where: { codigoregionales: 'REG-BOG' },
      update: {},
      create: {
        comercios_idcomercios: comercio.idcomercios,
        codigoregionales: 'REG-BOG',
        nombreregionales: 'Regional Bogotá',
        activoregionales: true,
      },
    }),
    prisma.regional.upsert({
      where: { codigoregionales: 'REG-MED' },
      update: {},
      create: {
        comercios_idcomercios: comercio.idcomercios,
        codigoregionales: 'REG-MED',
        nombreregionales: 'Regional Medellín',
        activoregionales: true,
      },
    }),
  ])
  console.log(`✓ Regionales: ${regBogota.nombreregionales}, ${regMedellin.nombreregionales}`)

  // ── 3. SUCURSALES ─────────────────────────────────────────────────────────
  const [sucPrincipal, sucNorte, sucMed] = await Promise.all([
    prisma.sucursal.upsert({
      where: { codigosucursales: 'SUC-BOG-001' },
      update: {},
      create: {
        regionales_idregionales:       regBogota.idregionales,
        paises_idpaises:               GEO.colombia,
        departamentos_iddepartamentos: GEO.cundinamarca,
        ciudades_idciudades:           GEO.bogota,
        codigosucursales: 'SUC-BOG-001',
        nombresucursales: 'Bogotá Centro',
        direccionsucursales: 'Carrera 7 # 16-36',
        tiposucursales: 'multipuesto',
        telefonosucursales: '6017447000',
        emailsucursales: 'bogotacentroemail.com',
        activosucursales: true,
      },
    }),
    prisma.sucursal.upsert({
      where: { codigosucursales: 'SUC-BOG-002' },
      update: {},
      create: {
        regionales_idregionales:       regBogota.idregionales,
        paises_idpaises:               GEO.colombia,
        departamentos_iddepartamentos: GEO.cundinamarca,
        ciudades_idciudades:           GEO.bogota,
        codigosucursales: 'SUC-BOG-002',
        nombresucursales: 'Bogotá Norte',
        direccionsucursales: 'Calle 127 # 15-05',
        tiposucursales: 'unipersonal',
        emailsucursales: 'bogotanorteemail.com',
        activosucursales: true,
      },
    }),
    prisma.sucursal.upsert({
      where: { codigosucursales: 'SUC-MED-001' },
      update: {},
      create: {
        regionales_idregionales:       regMedellin.idregionales,
        paises_idpaises:               GEO.colombia,
        departamentos_iddepartamentos: GEO.antioquia,
        ciudades_idciudades:           GEO.medellin,
        codigosucursales: 'SUC-MED-001',
        nombresucursales: 'Medellín El Poblado',
        direccionsucursales: 'Carrera 43A # 18-17',
        tiposucursales: 'unipersonal',
        emailsucursales: 'medellinpobladoemail.com',
        activosucursales: true,
      },
    }),
  ])
  console.log(`✓ Sucursales: ${sucPrincipal.nombresucursales}, ${sucNorte.nombresucursales}, ${sucMed.nombresucursales}`)

  // ── 4. ROLES ──────────────────────────────────────────────────────────────
  const rolesData = [
    { codigoroles: 'ADMIN_SISTEMA',        nombreroles: 'Administrador de Sistema' },
    { codigoroles: 'ADMIN_NACIONAL',       nombreroles: 'Administrador Nacional' },
    { codigoroles: 'SUPERVISOR_REGIONAL',  nombreroles: 'Supervisor Regional' },
    { codigoroles: 'CAJERO',               nombreroles: 'Cajero' },
    { codigoroles: 'TESORERIA',            nombreroles: 'Tesorería' },
    { codigoroles: 'INVENTARIOS',          nombreroles: 'Inventarios' },
  ]

  const roles: Record<string, { idroles: number }> = {}
  for (const r of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { codigoroles: r.codigoroles },
      update: {},
      create: { ...r, activoroles: true },
    })
    roles[r.codigoroles] = rol
  }
  console.log(`✓ Roles: ${Object.keys(roles).join(', ')}`)

  // ── 5. PERMISOS ───────────────────────────────────────────────────────────
  const permisosData = [
    // Caja
    { codigopermisos: 'caja:apertura',      descripcionpermisos: 'Abrir sesión de caja',          modulopermisos: 'caja' },
    { codigopermisos: 'caja:cierre',        descripcionpermisos: 'Cerrar sesión de caja',          modulopermisos: 'caja' },
    { codigopermisos: 'caja:consultar',     descripcionpermisos: 'Consultar estado de caja',       modulopermisos: 'caja' },
    { codigopermisos: 'caja:reposicion',    descripcionpermisos: 'Solicitar reposición de caja',   modulopermisos: 'caja' },
    // Ventas
    { codigopermisos: 'ventas:crear',       descripcionpermisos: 'Crear venta de productos',       modulopermisos: 'ventas' },
    { codigopermisos: 'ventas:anular',      descripcionpermisos: 'Anular venta',                   modulopermisos: 'ventas' },
    { codigopermisos: 'ventas:consultar',   descripcionpermisos: 'Consultar ventas',               modulopermisos: 'ventas' },
    // Envíos
    { codigopermisos: 'envios:crear',       descripcionpermisos: 'Crear guía de envío',            modulopermisos: 'envios' },
    { codigopermisos: 'envios:anular',      descripcionpermisos: 'Anular envío',                   modulopermisos: 'envios' },
    { codigopermisos: 'envios:consultar',   descripcionpermisos: 'Consultar envíos',               modulopermisos: 'envios' },
    // Giros
    { codigopermisos: 'giros:emitir',       descripcionpermisos: 'Emitir giro nacional',           modulopermisos: 'giros' },
    { codigopermisos: 'giros:pagar',        descripcionpermisos: 'Pagar giro',                     modulopermisos: 'giros' },
    { codigopermisos: 'giros:consultar',    descripcionpermisos: 'Consultar giros',                modulopermisos: 'giros' },
    // Recaudos
    { codigopermisos: 'recaudos:registrar', descripcionpermisos: 'Registrar recaudo',              modulopermisos: 'recaudos' },
    { codigopermisos: 'recaudos:consultar', descripcionpermisos: 'Consultar recaudos',             modulopermisos: 'recaudos' },
    // Inventario
    { codigopermisos: 'inventario:consultar', descripcionpermisos: 'Consultar inventario',         modulopermisos: 'inventario' },
    { codigopermisos: 'inventario:ajustar',   descripcionpermisos: 'Ajustar inventario',           modulopermisos: 'inventario' },
    { codigopermisos: 'inventario:orden',     descripcionpermisos: 'Gestionar órdenes de inventario', modulopermisos: 'inventario' },
    // Sacas
    { codigopermisos: 'sacas:crear',        descripcionpermisos: 'Crear y cerrar saca',            modulopermisos: 'sacas' },
    { codigopermisos: 'sacas:consultar',    descripcionpermisos: 'Consultar sacas',                modulopermisos: 'sacas' },
    // Apartados postales
    { codigopermisos: 'apartados:gestionar', descripcionpermisos: 'Gestionar apartados postales',  modulopermisos: 'apartados' },
    { codigopermisos: 'apartados:consultar', descripcionpermisos: 'Consultar apartados',           modulopermisos: 'apartados' },
    // Clientes
    { codigopermisos: 'clientes:crear',     descripcionpermisos: 'Crear / editar clientes',        modulopermisos: 'clientes' },
    { codigopermisos: 'clientes:consultar', descripcionpermisos: 'Consultar clientes',             modulopermisos: 'clientes' },
    // Consignaciones y tesorería
    { codigopermisos: 'tesoreria:consignacion', descripcionpermisos: 'Registrar consignación',     modulopermisos: 'tesoreria' },
    { codigopermisos: 'tesoreria:aprobar',      descripcionpermisos: 'Aprobar movimientos',        modulopermisos: 'tesoreria' },
    { codigopermisos: 'tesoreria:reportes',     descripcionpermisos: 'Ver reportes de tesorería',  modulopermisos: 'tesoreria' },
    // Admin
    { codigopermisos: 'admin:usuarios',     descripcionpermisos: 'Gestionar usuarios',             modulopermisos: 'admin' },
    { codigopermisos: 'admin:sucursales',   descripcionpermisos: 'Gestionar sucursales',           modulopermisos: 'admin' },
    { codigopermisos: 'admin:catalogos',    descripcionpermisos: 'Gestionar catálogos',            modulopermisos: 'admin' },
    { codigopermisos: 'admin:feature_flags', descripcionpermisos: 'Gestionar feature flags',       modulopermisos: 'admin' },
    { codigopermisos: 'admin:auditoria',    descripcionpermisos: 'Ver auditoría completa',         modulopermisos: 'admin' },
  ]

  const permisos: Record<string, { idpermisos: number }> = {}
  for (const p of permisosData) {
    const permiso = await prisma.permiso.upsert({
      where: { codigopermisos: p.codigopermisos },
      update: {},
      create: p,
    })
    permisos[p.codigopermisos] = permiso
  }
  console.log(`✓ Permisos: ${Object.keys(permisos).length} permisos creados`)

  // ── 6. ROLES ↔ PERMISOS ──────────────────────────────────────────────────
  const rolPermisoMap: Record<string, string[]> = {
    ADMIN_SISTEMA: Object.keys(permisos),
    ADMIN_NACIONAL: Object.keys(permisos).filter(p => !p.startsWith('admin:')).concat(['admin:usuarios', 'admin:catalogos', 'admin:auditoria']),
    SUPERVISOR_REGIONAL: [
      'caja:consultar', 'ventas:consultar', 'ventas:anular', 'envios:consultar',
      'envios:anular', 'giros:consultar', 'recaudos:consultar', 'inventario:consultar',
      'inventario:ajustar', 'inventario:orden', 'sacas:crear', 'sacas:consultar',
      'apartados:gestionar', 'apartados:consultar', 'clientes:crear', 'clientes:consultar',
      'tesoreria:aprobar', 'tesoreria:reportes',
    ],
    CAJERO: [
      'caja:apertura', 'caja:cierre', 'caja:consultar', 'caja:reposicion',
      'ventas:crear', 'ventas:consultar', 'envios:crear', 'envios:consultar',
      'giros:emitir', 'giros:pagar', 'giros:consultar', 'recaudos:registrar',
      'recaudos:consultar', 'sacas:crear', 'sacas:consultar',
      'apartados:gestionar', 'apartados:consultar', 'clientes:crear', 'clientes:consultar',
    ],
    TESORERIA: [
      'caja:consultar', 'tesoreria:consignacion', 'tesoreria:aprobar', 'tesoreria:reportes',
      'ventas:consultar', 'recaudos:consultar',
    ],
    INVENTARIOS: [
      'inventario:consultar', 'inventario:ajustar', 'inventario:orden',
      'ventas:consultar', 'envios:consultar',
    ],
  }

  for (const [rolCodigo, codigosPermisos] of Object.entries(rolPermisoMap)) {
    const rol = roles[rolCodigo]
    for (const codigo of codigosPermisos) {
      const permiso = permisos[codigo]
      if (!permiso) continue
      await prisma.rolPermiso.upsert({
        where: { roles_idroles_permisos_idpermisos: { roles_idroles: rol.idroles, permisos_idpermisos: permiso.idpermisos } },
        update: {},
        create: { roles_idroles: rol.idroles, permisos_idpermisos: permiso.idpermisos },
      })
    }
  }
  console.log('✓ Roles ↔ Permisos asignados')

  // ── 7. USUARIOS ───────────────────────────────────────────────────────────
  // Las contraseñas de seed son datos de prueba — las cuentas reales se
  // crean fuera del seed (scripts de onboarding o panel de administración).
  const adminSeedEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@4-72.com.co'
  const adminSeedPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin472!'
  const adminHash = await hash(adminSeedPassword, 10)

  const adminUser = await prisma.usuario.upsert({
    where: { emailusuarios: adminSeedEmail },
    update: {},
    create: {
      sucursales_idsucursales: null,
      roles_idroles: roles['ADMIN_SISTEMA'].idroles,
      nombreusuarios: 'Administrador Seed',
      emailusuarios: adminSeedEmail,
      password_hashusuarios: adminHash,
      activousuarios: true,
    },
  })

  const cajeroHash = await hash('Seed.Cajero.Dev1!', 10)
  const cajero = await prisma.usuario.upsert({
    where: { emailusuarios: 'cajero@4-72.com.co' },
    update: { sucursales_idsucursales: sucMed.idsucursales, activousuarios: false },
    create: {
      sucursales_idsucursales: sucMed.idsucursales,
      roles_idroles: roles['CAJERO'].idroles,
      nombreusuarios: 'Cajero Seed',
      emailusuarios: 'cajero@4-72.com.co',
      password_hashusuarios: cajeroHash,
      activousuarios: false,
    },
  })

  const vendedorHash = await hash('Vendedor.472', 10)
  const vendedor = await prisma.usuario.upsert({
    where: { emailusuarios: 'vendedor@4-72.com.co' },
    update: { password_hashusuarios: vendedorHash, activousuarios: true },
    create: {
      sucursales_idsucursales: sucPrincipal.idsucursales,
      roles_idroles: roles['CAJERO'].idroles,
      nombreusuarios: 'Vendedor.472',
      emailusuarios: 'vendedor@4-72.com.co',
      password_hashusuarios: vendedorHash,
      activousuarios: true,
    },
  })

  const adminNacHash = await hash('AdminNac472!', 10)
  const adminNac = await prisma.usuario.upsert({
    where: { emailusuarios: 'admin.nacional@4-72.com.co' },
    update: { password_hashusuarios: adminNacHash, activousuarios: true },
    create: {
      sucursales_idsucursales: null,
      roles_idroles: roles['ADMIN_NACIONAL'].idroles,
      nombreusuarios: 'Admin Nacional',
      emailusuarios: 'admin.nacional@4-72.com.co',
      password_hashusuarios: adminNacHash,
      activousuarios: true,
    },
  })
  console.log(`✓ Usuarios seed: ${adminUser.emailusuarios}, ${cajero.emailusuarios}, ${vendedor.emailusuarios}, ${adminNac.emailusuarios}`)

  // ── 8. TIPOS DE CLIENTE ───────────────────────────────────────────────────
  const tiposClienteData = [
    { codigotipos_cliente: 'GENERAL',   nombretipos_cliente: 'Cliente General',    descuento_porcentajetipos_cliente: 0,   aplica_estampillastipos_cliente: false, aplica_giros_sisbentipos_cliente: false },
    { codigotipos_cliente: 'SISBEN_1',  nombretipos_cliente: 'Sisben Nivel 1',     descuento_porcentajetipos_cliente: 10,  aplica_estampillastipos_cliente: true,  aplica_giros_sisbentipos_cliente: true  },
    { codigotipos_cliente: 'SISBEN_2',  nombretipos_cliente: 'Sisben Nivel 2',     descuento_porcentajetipos_cliente: 5,   aplica_estampillastipos_cliente: true,  aplica_giros_sisbentipos_cliente: true  },
    { codigotipos_cliente: 'EMPRESARIAL', nombretipos_cliente: 'Cliente Empresarial', descuento_porcentajetipos_cliente: 15, aplica_estampillastipos_cliente: false, aplica_giros_sisbentipos_cliente: false },
  ]

  const tiposCliente: Record<string, { idtipos_cliente: number }> = {}
  for (const tc of tiposClienteData) {
    const tipo = await prisma.tipoCliente.upsert({
      where: { codigotipos_cliente: tc.codigotipos_cliente },
      update: {},
      create: { ...tc, comercios_idcomercios: comercio.idcomercios, activotipos_cliente: true },
    })
    tiposCliente[tc.codigotipos_cliente] = tipo
  }
  console.log(`✓ Tipos de cliente: ${Object.keys(tiposCliente).join(', ')}`)

  // ── 9. PRODUCTOS ──────────────────────────────────────────────────────────
  const productosData = [
    // Estampillas — catálogo real 4-72
    { codigoproductos: 'ES-001', nombreproductos: 'ES 100 Años Escuela Superior de Guerra',               tipoproductos: 'estampilla' as const, precioproductos:  5500, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-002', nombreproductos: 'ES Federación Nacional de Cafeteros de Colombia 90',   tipoproductos: 'estampilla' as const, precioproductos:    50, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-003', nombreproductos: 'ES Policarpa Salavarrieta bicentenario de su sacri',   tipoproductos: 'estampilla' as const, precioproductos:   100, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-004', nombreproductos: 'ES C.R.I',                                              tipoproductos: 'estampilla' as const, precioproductos:  2600, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-005', nombreproductos: 'ES Premio Nobel de la Paz 2016 Juan Manuel Santos',    tipoproductos: 'estampilla' as const, precioproductos:    20, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-006', nombreproductos: 'ES 1er Festival Internacional de Historia',            tipoproductos: 'estampilla' as const, precioproductos:  1000, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-007', nombreproductos: 'ES XXIII Juegos Centroamericano y del Caribe Baran',  tipoproductos: 'estampilla' as const, precioproductos:   200, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-008', nombreproductos: 'ES Buque Escuela Gloria 50 Años 1968-2018',           tipoproductos: 'estampilla' as const, precioproductos:  5000, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-009', nombreproductos: 'ES Batallon Guardia Presidencial 90 Años',            tipoproductos: 'estampilla' as const, precioproductos:   200, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-010', nombreproductos: 'ES Orquideas Endemicas de Colombia',                  tipoproductos: 'estampilla' as const, precioproductos:   500, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-011', nombreproductos: 'ES Region del Catatumbo y Provincia de Ocaña',        tipoproductos: 'estampilla' as const, precioproductos:  1000, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-012', nombreproductos: 'ES Comunicaciones Fuerzas Militares 74 Años 1944-2', tipoproductos: 'estampilla' as const, precioproductos:    20, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-013', nombreproductos: 'ES America UPAEP 2018 Animales Domesticos',           tipoproductos: 'estampilla' as const, precioproductos:  4000, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ES-014', nombreproductos: 'ES Navidad 2018',                                     tipoproductos: 'estampilla' as const, precioproductos: 10000, porcentaje_taxproductos: 0 },
    // Material de Empaque (ME)
    { codigoproductos: 'ME-CES-S',    nombreproductos: 'ME Caja Especial S 37x28x6',       tipoproductos: 'empaque' as const,         precioproductos: 11860, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-CES-M',    nombreproductos: 'ME Caja Especial M 37x28x14',      tipoproductos: 'empaque' as const,         precioproductos:  3700, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-CES-G',    nombreproductos: 'ME Caja Especial G 40x30x30',      tipoproductos: 'empaque' as const,         precioproductos:  5250, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-BSG',      nombreproductos: 'ME Bolsa de seguridad',             tipoproductos: 'empaque' as const,         precioproductos:   550, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-SCC',      nombreproductos: 'ME Sobre de Cartón Carta',          tipoproductos: 'empaque' as const,         precioproductos:   750, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-CCO-S',    nombreproductos: 'ME Caja Corriente S 50x40x30',     tipoproductos: 'empaque' as const,         precioproductos:  5050, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-CCO-M',    nombreproductos: 'ME Caja Corriente M 60x40x40',     tipoproductos: 'empaque' as const,         precioproductos: 11204, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-SDP-HC',   nombreproductos: "ME Sobre 'De-Para' Media Carta",   tipoproductos: 'empaque' as const,         precioproductos:   250, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-SDP-C',    nombreproductos: "ME Sobre 'De-Para' Carta",         tipoproductos: 'empaque' as const,         precioproductos:   250, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-SDP-O',    nombreproductos: "ME Sobre 'De-Para' Oficio",        tipoproductos: 'empaque' as const,         precioproductos:   350, porcentaje_taxproductos: 0 },
    { codigoproductos: 'ME-SDP-EO',   nombreproductos: "ME Sobre 'De-Para' Extra Oficio",  tipoproductos: 'empaque' as const,         precioproductos:   450, porcentaje_taxproductos: 0 },
    // Material de oficina
    { codigoproductos: 'PAPEL-BOND',  nombreproductos: 'Papel Bond A4 (500h)',             tipoproductos: 'material_oficina' as const, precioproductos: 15000, porcentaje_taxproductos: 19 },
    // Filatelia
    {
      codigoproductos:         'FIL-001',
      nombreproductos:         'Carpeta Primer Día — Fauna Endémica Colombiana',
      descripcionproductos:    'Carpeta de primer día de emisión con sello y matasellos especial. Serie Fauna Endémica de Colombia 2024.',
      serieproductos:          'Fauna Endémica de Colombia 2024',
      tipoproductos:           'filatelia' as const,
      precioproductos:         35000,
      porcentaje_taxproductos: 0,
    },
    {
      codigoproductos:         'FIL-002',
      nombreproductos:         'Hoja Bloque — Centenario Banco de la República',
      descripcionproductos:    'Hoja bloque conmemorativa del centenario del Banco de la República 1923-2023. Edición limitada.',
      serieproductos:          'Conmemorativa Institucional',
      tipoproductos:           'filatelia' as const,
      precioproductos:         28000,
      porcentaje_taxproductos: 0,
    },
  ]

  const productos: Record<string, { idproductos: number }> = {}
  for (const p of productosData) {
    const prod = await prisma.producto.upsert({
      where: { codigoproductos: p.codigoproductos },
      update: {},
      create: { ...p, activoproductos: true },
    })
    productos[p.codigoproductos] = prod
  }
  console.log(`✓ Productos: ${Object.keys(productos).length} productos`)

  // ── 10. PRODUCTOS POR SUCURSAL ────────────────────────────────────────────
  const sucursales = [sucPrincipal, sucNorte, sucMed]
  for (const suc of sucursales) {
    for (const prod of Object.values(productos)) {
      await prisma.productoSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: suc.idsucursales,
            productos_idproductos: prod.idproductos,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales: suc.idsucursales,
          productos_idproductos: prod.idproductos,
          activoproductos_sucursal: true,
        },
      })
    }
  }
  console.log('✓ Productos habilitados en todas las sucursales')

  // ── 11. SERVICIOS DE ENVÍO ────────────────────────────────────────────────
  const serviciosData = [
    // ── Correo No Prioritario ─────────────────────────────────────────────────
    {
      codigoservicios: 'NP-DOC-NOR',
      nombreservicios: 'Corr. No Prioritaria Normal - Documentos',
      descripcionservicios: 'Correo no prioritario normal para documentos (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 7,
      codigo_sigmaservicios: 'NPDN',
    },
    {
      codigoservicios: 'NP-DOC-CERT',
      nombreservicios: 'Corr. No Prioritaria - Doc. con Certi.',
      descripcionservicios: 'Correo no prioritario certificado para documentos (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 8,
      codigo_sigmaservicios: 'NPDC',
      prefijo_guia_servicios: 'RA',
      tarifa_certificacionservicios: 1800,
    },
    {
      codigoservicios: 'NP-PAQ-NOR',
      nombreservicios: 'Corr. No Prioritaria Normal - Paquetes',
      descripcionservicios: 'Correo no prioritario normal para paquetes (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: true,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 7,
      codigo_sigmaservicios: 'NPPN',
    },
    {
      codigoservicios: 'NP-PAQ-CERT',
      nombreservicios: 'Corr. No Prioritaria - Paque. con Certi.',
      descripcionservicios: 'Correo no prioritario certificado para paquetes (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: true,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 8,
      codigo_sigmaservicios: 'NPPC',
      prefijo_guia_servicios: 'RA',
      tarifa_certificacionservicios: 1800,
    },
    // ── Correo Prioritario ────────────────────────────────────────────────────
    {
      codigoservicios: 'P-DOC-NOR',
      nombreservicios: 'Corr. Prioritaria Normal - Documentos',
      descripcionservicios: 'Correo prioritario normal para documentos (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 3,
      codigo_sigmaservicios: 'PDN',
    },
    {
      codigoservicios: 'P-DOC-CERT',
      nombreservicios: 'Corr. Prioritaria Documentos con Certi.',
      descripcionservicios: 'Correo prioritario certificado para documentos (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 3,
      codigo_sigmaservicios: 'PDC',
      prefijo_guia_servicios: 'RA',
      tarifa_certificacionservicios: 1800,
    },
    {
      codigoservicios: 'P-PAQ-NOR',
      nombreservicios: 'Corr. Prioritaria Normal - Paquetes',
      descripcionservicios: 'Correo prioritario normal para paquetes (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: true,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 3,
      codigo_sigmaservicios: 'PPN',
    },
    {
      codigoservicios: 'P-PAQ-CERT',
      nombreservicios: 'Corr. Prioritaria Paquetes con Certi.',
      descripcionservicios: 'Correo prioritario certificado para paquetes (tarifa 2004)',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: true,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 3,
      codigo_sigmaservicios: 'PPC',
      prefijo_guia_servicios: 'RA',
      tarifa_certificacionservicios: 1800,
    },
    {
      codigoservicios: 'AL-DIA',
      nombreservicios: 'Al Día',
      descripcionservicios: 'Servicio de entrega urgente al día siguiente hábil en cobertura nacional',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: false,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 1,
      codigo_sigmaservicios: 'ALD',
    },
    {
      codigoservicios: 'NOTIF',
      nombreservicios: 'Notificaciones',
      descripcionservicios: 'Servicio para notificaciones judiciales y administrativas con validez legal',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: false,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 3,
      codigo_sigmaservicios: 'NOT',
    },
    {
      codigoservicios: 'INT-MS',
      nombreservicios: 'Internacional EMS',
      descripcionservicios: 'Servicio postal internacional EMS (correo prioritario)',
      tiposervicios: 'internacional_ms' as const,
      requiere_estampillaservicios: false,
      requiere_dimensionesservicios: true,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 15,
      codigo_sigmaservicios: 'EMS',
    },
    {
      codigoservicios: 'INT-COURIER',
      nombreservicios: 'Internacional Courier',
      descripcionservicios: 'Envío internacional vía courier con seguimiento',
      tiposervicios: 'internacional_courier' as const,
      requiere_estampillaservicios: false,
      requiere_dimensionesservicios: true,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 70,
      tiempo_entrega_diasservicios: 7,
      codigo_sigmaservicios: 'IC',
    },
    {
      codigoservicios: 'APART-POST',
      nombreservicios: 'Apartado Postal',
      descripcionservicios: 'Arrendamiento de casilla de apartado postal',
      tiposervicios: 'apartado_postal' as const,
      requiere_estampillaservicios: false,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      codigo_sigmaservicios: 'AP',
    },
  ]

  const servicios: Record<string, { idservicios: number }> = {}
  for (const s of serviciosData) {
    const { codigoservicios, tarifa_certificacionservicios: cert, prefijo_guia_servicios: prefijoGuia, ...rest } = s as any
    const servicio = await prisma.servicio.upsert({
      where:  { codigoservicios },
      update: {
        tarifa_certificacionservicios: cert ?? null,
        prefijo_guia_servicios:        prefijoGuia ?? null,
      },
      create: {
        codigoservicios,
        ...rest,
        tarifa_certificacionservicios: cert ?? null,
        prefijo_guia_servicios:        prefijoGuia ?? null,
        activoservicios:               true,
      },
    })
    servicios[codigoservicios] = servicio
  }
  console.log(`✓ Servicios: ${Object.keys(servicios).length} servicios`)

  // ── 12. SERVICIOS POR SUCURSAL ────────────────────────────────────────────
  for (const suc of sucursales) {
    for (const srv of Object.values(servicios)) {
      await prisma.servicioSucursal.upsert({
        where: {
          sucursales_idsucursales_servicios_idservicios: {
            sucursales_idsucursales: suc.idsucursales,
            servicios_idservicios: srv.idservicios,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales: suc.idsucursales,
          servicios_idservicios: srv.idservicios,
          activoservicios_sucursal: true,
        },
      })
    }
  }
  console.log('✓ Servicios habilitados en todas las sucursales')

  // ── 13. TARIFAS CORREO NACIONAL (tarifas oficiales 4-72) ─────────────────
  // Siempre borra y re-inserta para que re-ejecutar el seed actualice las tarifas.
  type TramoTarifa = { peso_min: number; peso_max: number | null; tarifa: number; tarifa_kg_adicional?: number }
  const tarifasCorreo: { codigo: string; tramos: TramoTarifa[] }[] = [
    // ── Correo No Prioritario Normal — Documentos (max 2 kg) ──
    { codigo: 'NP-DOC-NOR', tramos: [
      { peso_min: 0,     peso_max: 0.02,  tarifa: 1500 },
      { peso_min: 0.02,  peso_max: 0.05,  tarifa: 2100 },
      { peso_min: 0.05,  peso_max: 0.1,   tarifa: 2800 },
      { peso_min: 0.1,   peso_max: 0.25,  tarifa: 3900 },
      { peso_min: 0.25,  peso_max: 0.5,   tarifa: 4850 },
      { peso_min: 0.5,   peso_max: 1,     tarifa: 6100 },
      { peso_min: 1,     peso_max: 2,     tarifa: 7800 },
    ]},
    // ── Correo No Prioritario con Certificación — Documentos (mismos tramos base) ──
    { codigo: 'NP-DOC-CERT', tramos: [
      { peso_min: 0,     peso_max: 0.02,  tarifa: 1500 },
      { peso_min: 0.02,  peso_max: 0.05,  tarifa: 2100 },
      { peso_min: 0.05,  peso_max: 0.1,   tarifa: 2800 },
      { peso_min: 0.1,   peso_max: 0.25,  tarifa: 3900 },
      { peso_min: 0.25,  peso_max: 0.5,   tarifa: 4850 },
      { peso_min: 0.5,   peso_max: 1,     tarifa: 6100 },
      { peso_min: 1,     peso_max: 2,     tarifa: 7800 },
    ]},
    // ── Correo No Prioritario Normal — Paquetes (max 30 kg) ──
    { codigo: 'NP-PAQ-NOR', tramos: [
      { peso_min: 0,    peso_max: 1,    tarifa: 4850 },
      { peso_min: 1,    peso_max: 2,    tarifa: 9500 },
      { peso_min: 2,    peso_max: 5,    tarifa: 16000 },
      { peso_min: 5,    peso_max: 10,   tarifa: 27000 },
      { peso_min: 10,   peso_max: 20,   tarifa: 48000 },
      { peso_min: 20,   peso_max: null, tarifa: 75000, tarifa_kg_adicional: 3500 },
    ]},
    // ── Correo No Prioritario con Certificación — Paquetes ──
    { codigo: 'NP-PAQ-CERT', tramos: [
      { peso_min: 0,    peso_max: 1,    tarifa: 4850 },
      { peso_min: 1,    peso_max: 2,    tarifa: 9500 },
      { peso_min: 2,    peso_max: 5,    tarifa: 16000 },
      { peso_min: 5,    peso_max: 10,   tarifa: 27000 },
      { peso_min: 10,   peso_max: 20,   tarifa: 48000 },
      { peso_min: 20,   peso_max: null, tarifa: 75000, tarifa_kg_adicional: 3500 },
    ]},
    // ── Correo Prioritario Normal — Documentos (max 2 kg) ──
    { codigo: 'P-DOC-NOR', tramos: [
      { peso_min: 0,     peso_max: 0.02,  tarifa: 2100 },
      { peso_min: 0.02,  peso_max: 0.05,  tarifa: 2900 },
      { peso_min: 0.05,  peso_max: 0.1,   tarifa: 3900 },
      { peso_min: 0.1,   peso_max: 0.25,  tarifa: 5500 },
      { peso_min: 0.25,  peso_max: 0.5,   tarifa: 6800 },
      { peso_min: 0.5,   peso_max: 1,     tarifa: 7250 },
      { peso_min: 1,     peso_max: 2,     tarifa: 10500 },
    ]},
    // ── Correo Prioritario con Certificación — Documentos ──
    { codigo: 'P-DOC-CERT', tramos: [
      { peso_min: 0,     peso_max: 0.02,  tarifa: 2100 },
      { peso_min: 0.02,  peso_max: 0.05,  tarifa: 2900 },
      { peso_min: 0.05,  peso_max: 0.1,   tarifa: 3900 },
      { peso_min: 0.1,   peso_max: 0.25,  tarifa: 5500 },
      { peso_min: 0.25,  peso_max: 0.5,   tarifa: 6800 },
      { peso_min: 0.5,   peso_max: 1,     tarifa: 7250 },
      { peso_min: 1,     peso_max: 2,     tarifa: 10500 },
    ]},
    // ── Correo Prioritario Normal — Paquetes (max 30 kg) ──
    { codigo: 'P-PAQ-NOR', tramos: [
      { peso_min: 0,    peso_max: 1,    tarifa: 6800 },
      { peso_min: 1,    peso_max: 2,    tarifa: 13300 },
      { peso_min: 2,    peso_max: 5,    tarifa: 22400 },
      { peso_min: 5,    peso_max: 10,   tarifa: 37800 },
      { peso_min: 10,   peso_max: 20,   tarifa: 67200 },
      { peso_min: 20,   peso_max: null, tarifa: 105000, tarifa_kg_adicional: 4900 },
    ]},
    // ── Correo Prioritario con Certificación — Paquetes ──
    { codigo: 'P-PAQ-CERT', tramos: [
      { peso_min: 0,    peso_max: 1,    tarifa: 6800 },
      { peso_min: 1,    peso_max: 2,    tarifa: 13300 },
      { peso_min: 2,    peso_max: 5,    tarifa: 22400 },
      { peso_min: 5,    peso_max: 10,   tarifa: 37800 },
      { peso_min: 10,   peso_max: 20,   tarifa: 67200 },
      { peso_min: 20,   peso_max: null, tarifa: 105000, tarifa_kg_adicional: 4900 },
    ]},
  ]

  let totalTarifasCorreo = 0
  for (const svc of tarifasCorreo) {
    const svcId = servicios[svc.codigo]?.idservicios
    if (!svcId) continue
    await prisma.tarifaServicio.deleteMany({ where: { servicios_idservicios: svcId } })
    for (const t of svc.tramos) {
      await prisma.tarifaServicio.create({
        data: {
          servicios_idservicios:               svcId,
          pais_destinotarifas_servicio:        'CO',
          peso_min_kgtarifas_servicio:         t.peso_min,
          peso_max_kgtarifas_servicio:         t.peso_max ?? null,
          tarifatarifas_servicio:              t.tarifa,
          tarifa_kg_adicionaltarifas_servicio: t.tarifa_kg_adicional ?? null,
          activatarifas_servicio:              true,
        },
      })
      totalTarifasCorreo++
    }
  }
  console.log(`✓ Tarifas correo correspondencia 4-72: ${totalTarifasCorreo} filas (8 servicios)`)

  // ── 13b. TARIFAS INTERNACIONALES EMS (muestra — actualizar con tabla UPU oficial) ─────
  // Tasas aproximadas en COP (1 USD ≈ 4 200 COP, tarifas UPU zona América/Europa)
  const tarifasIntlMs: { pais: string; peso_min: number; peso_max?: number; tarifa: number; tarifa_kg_adic?: number }[] = [
    // Estados Unidos (US)
    { pais: 'US', peso_min: 0,   peso_max: 0.5, tarifa: 80000 },
    { pais: 'US', peso_min: 0.5, peso_max: 1,   tarifa: 110000 },
    { pais: 'US', peso_min: 1,   peso_max: 2,   tarifa: 150000, tarifa_kg_adic: 45000 },
    { pais: 'US', peso_min: 2,   peso_max: 30,  tarifa: 200000, tarifa_kg_adic: 40000 },
    // España (ES)
    { pais: 'ES', peso_min: 0,   peso_max: 0.5, tarifa: 90000 },
    { pais: 'ES', peso_min: 0.5, peso_max: 1,   tarifa: 125000 },
    { pais: 'ES', peso_min: 1,   peso_max: 2,   tarifa: 170000, tarifa_kg_adic: 50000 },
    { pais: 'ES', peso_min: 2,   peso_max: 30,  tarifa: 220000, tarifa_kg_adic: 48000 },
    // Brasil (BR)
    { pais: 'BR', peso_min: 0,   peso_max: 0.5, tarifa: 70000 },
    { pais: 'BR', peso_min: 0.5, peso_max: 1,   tarifa: 95000 },
    { pais: 'BR', peso_min: 1,   peso_max: 2,   tarifa: 130000, tarifa_kg_adic: 38000 },
    { pais: 'BR', peso_min: 2,   peso_max: 30,  tarifa: 175000, tarifa_kg_adic: 35000 },
    // México (MX)
    { pais: 'MX', peso_min: 0,   peso_max: 0.5, tarifa: 75000 },
    { pais: 'MX', peso_min: 0.5, peso_max: 1,   tarifa: 100000 },
    { pais: 'MX', peso_min: 1,   peso_max: 2,   tarifa: 135000, tarifa_kg_adic: 40000 },
    { pais: 'MX', peso_min: 2,   peso_max: 30,  tarifa: 180000, tarifa_kg_adic: 37000 },
    // Alemania (DE)
    { pais: 'DE', peso_min: 0,   peso_max: 0.5, tarifa: 90000 },
    { pais: 'DE', peso_min: 0.5, peso_max: 1,   tarifa: 125000 },
    { pais: 'DE', peso_min: 1,   peso_max: 2,   tarifa: 170000, tarifa_kg_adic: 50000 },
    { pais: 'DE', peso_min: 2,   peso_max: 30,  tarifa: 220000, tarifa_kg_adic: 48000 },
    // Francia (FR)
    { pais: 'FR', peso_min: 0,   peso_max: 0.5, tarifa: 92000 },
    { pais: 'FR', peso_min: 0.5, peso_max: 1,   tarifa: 128000 },
    { pais: 'FR', peso_min: 1,   peso_max: 2,   tarifa: 172000, tarifa_kg_adic: 50000 },
    { pais: 'FR', peso_min: 2,   peso_max: 30,  tarifa: 222000, tarifa_kg_adic: 48000 },
    // Canada (CA)
    { pais: 'CA', peso_min: 0,   peso_max: 0.5, tarifa: 82000 },
    { pais: 'CA', peso_min: 0.5, peso_max: 1,   tarifa: 112000 },
    { pais: 'CA', peso_min: 1,   peso_max: 2,   tarifa: 152000, tarifa_kg_adic: 45000 },
    { pais: 'CA', peso_min: 2,   peso_max: 30,  tarifa: 202000, tarifa_kg_adic: 40000 },
    // Ecuador (EC)
    { pais: 'EC', peso_min: 0,   peso_max: 0.5, tarifa: 65000 },
    { pais: 'EC', peso_min: 0.5, peso_max: 1,   tarifa: 88000 },
    { pais: 'EC', peso_min: 1,   peso_max: 2,   tarifa: 120000, tarifa_kg_adic: 35000 },
    { pais: 'EC', peso_min: 2,   peso_max: 30,  tarifa: 160000, tarifa_kg_adic: 32000 },
    // Perú (PE)
    { pais: 'PE', peso_min: 0,   peso_max: 0.5, tarifa: 67000 },
    { pais: 'PE', peso_min: 0.5, peso_max: 1,   tarifa: 90000 },
    { pais: 'PE', peso_min: 1,   peso_max: 2,   tarifa: 122000, tarifa_kg_adic: 35000 },
    { pais: 'PE', peso_min: 2,   peso_max: 30,  tarifa: 163000, tarifa_kg_adic: 32000 },
    // Venezuela (VE)
    { pais: 'VE', peso_min: 0,   peso_max: 0.5, tarifa: 63000 },
    { pais: 'VE', peso_min: 0.5, peso_max: 1,   tarifa: 85000 },
    { pais: 'VE', peso_min: 1,   peso_max: 2,   tarifa: 115000, tarifa_kg_adic: 33000 },
    { pais: 'VE', peso_min: 2,   peso_max: 30,  tarifa: 153000, tarifa_kg_adic: 30000 },
  ]

  for (const t of tarifasIntlMs) {
    await prisma.tarifaServicio.create({
      data: {
        servicios_idservicios:                servicios['INT-MS'].idservicios,
        pais_destinotarifas_servicio:         t.pais,
        peso_min_kgtarifas_servicio:          t.peso_min,
        peso_max_kgtarifas_servicio:          t.peso_max ?? null,
        tarifatarifas_servicio:               t.tarifa,
        tarifa_kg_adicionaltarifas_servicio:  t.tarifa_kg_adic ?? null,
        activatarifas_servicio:               true,
      },
    })
  }
  console.log(`✓ Tarifas internacionales EMS: ${tarifasIntlMs.length} filas (10 países)`)

  // ── 14. INVENTARIO INICIAL ────────────────────────────────────────────────
  const estampillas = Object.entries(productos).filter(([k]) => k.startsWith('EST-'))
  for (const suc of sucursales) {
    for (const [, prod] of estampillas) {
      await prisma.inventarioSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: suc.idsucursales,
            productos_idproductos: prod.idproductos,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales: suc.idsucursales,
          productos_idproductos: prod.idproductos,
          cantidad_actualinventario_sucursal: 500,
          cantidad_minimainventario_sucursal: 50,
        },
      })
    }
    for (const [codigo, prod] of Object.entries(productos).filter(([k]) => k.startsWith('ME-'))) {
      await prisma.inventarioSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: suc.idsucursales,
            productos_idproductos: prod.idproductos,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales: suc.idsucursales,
          productos_idproductos: prod.idproductos,
          cantidad_actualinventario_sucursal: 100,
          cantidad_minimainventario_sucursal: 10,
        },
      })
    }
  }
  const filatelia = Object.entries(productos).filter(([k]) => k.startsWith('FIL-'))
  for (const suc of sucursales) {
    for (const [, prod] of filatelia) {
      await prisma.inventarioSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: suc.idsucursales,
            productos_idproductos:   prod.idproductos,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales:             suc.idsucursales,
          productos_idproductos:               prod.idproductos,
          cantidad_actualinventario_sucursal:  50,
          cantidad_minimainventario_sucursal:  5,
        },
      })
    }
  }
  console.log('✓ Inventario inicial para estampillas, empaques y filatelia')

  // ── 15. FEATURE FLAGS ─────────────────────────────────────────────────────
  // Los módulos existentes viven en la migración 20260702000001_v1_1_0_data_feature_flags.
  // Los nuevos módulos maestros se insertan aquí con activo=false (habilitación manual).
  await prisma.featureFlag.deleteMany({
    where: { codigofeature_flags: { in: ['modulo_geo'] } },
  })

  // Flags operativos de Tauri — activos en desarrollo para poder probar en navegador
  const flagsOperativos = [
    { codigo: 'modulo:caja',             descripcion: 'Módulo operativo de cajas y turnos (SUPERVISOR_REGIONAL / CAJERO)', activo: true,  plataforma: 'all'   },
    { codigo: 'modulo:ventas',           descripcion: 'Módulo de punto de venta (CAJERO)',                                 activo: true,  plataforma: 'all'   },
    { codigo: 'ventas:tab_productos',    descripcion: 'Tab Productos en caja de ventas',                                   activo: true,  plataforma: 'all'   },
    { codigo: 'ventas:tab_especiales',   descripcion: 'Tab Productos Especiales en caja de ventas',                        activo: true,  plataforma: 'all'   },
    { codigo: 'ventas:tab_apartado',     descripcion: 'Tab Apartados Postales en caja de ventas',                          activo: true,  plataforma: 'all'   },
    { codigo: 'ventas:tab_servicios',    descripcion: 'Tab Servicios Postales en caja de ventas',                          activo: true,  plataforma: 'tauri' },
    { codigo: 'ventas:tab_historial',    descripcion: 'Tab Historial de ventas en caja',                                     activo: true,  plataforma: 'all'   },
  ]
  for (const f of flagsOperativos) {
    await prisma.featureFlag.upsert({
      where:  { codigofeature_flags: f.codigo },
      update: { activofeature_flags: f.activo, plataformafeature_flags: f.plataforma as 'all' | 'tauri' },
      create: {
        codigofeature_flags:      f.codigo,
        descripcionfeature_flags: f.descripcion,
        activofeature_flags:      f.activo,
        entornofeature_flags:     'all',
        plataformafeature_flags:  f.plataforma as 'all' | 'tauri',
      },
    })
  }

  const nuevosFlags = [
    { codigo: 'modulo_usuarios',    descripcion: 'Módulo de administración de usuarios' },
    { codigo: 'modulo_comercios',   descripcion: 'Módulo de administración de comercios' },
    { codigo: 'modulo_regionales',  descripcion: 'Módulo de administración de regionales' },
    { codigo: 'modulo_sucursales',  descripcion: 'Módulo de administración de sucursales' },
    { codigo: 'modulo_equipos',     descripcion: 'Módulo de equipos autorizados (MAC guard)' },
    { codigo: 'modulo_productos',   descripcion: 'Módulo de catálogo de productos' },
    { codigo: 'modulo_servicios',   descripcion: 'Módulo de catálogo de servicios de envío' },
    { codigo: 'modulo_cajas',        descripcion: 'Módulo de gestión de cajas y turnos operativos' },
    { codigo: 'modulo_inventario',   descripcion: 'Módulo de inventario por sucursal' },
    { codigo: 'sistema_permisos',    descripcion: 'Panel de gestión de roles y permisos' },
    { codigo: 'sistema_aperturas',  descripcion: 'Panel de activación de módulos (feature flags)' },
    { codigo: 'sistema_auditoria',  descripcion: 'Panel de auditoría y trazabilidad de acciones' },
  ]
  for (const f of nuevosFlags) {
    await prisma.featureFlag.upsert({
      where:  { codigofeature_flags: f.codigo },
      update: {},
      create: {
        codigofeature_flags:      f.codigo,
        descripcionfeature_flags: f.descripcion,
        activofeature_flags:      false,
        entornofeature_flags:     'all',
        plataformafeature_flags:  'all',
      },
    })
  }
  const totalFlags = await prisma.featureFlag.count()
  console.log(`✓ Feature flags: ${totalFlags} total (${nuevosFlags.length} módulos maestros agregados)`)

  // ── 16. CONVENIOS DE RECAUDO ──────────────────────────────────────────────
  const conveniosData = [
    { codigoconvenios_recaudo: 'EPM',          nombreconvenios_recaudo: 'EPM Empresas Públicas de Medellín',   tipo_apiconvenios_recaudo: 'barcode' as const },
    { codigoconvenios_recaudo: 'ETB',          nombreconvenios_recaudo: 'ETB Empresa de Telecomunicaciones',  tipo_apiconvenios_recaudo: 'barcode' as const },
    { codigoconvenios_recaudo: 'CODENSA',      nombreconvenios_recaudo: 'Codensa Energía',                     tipo_apiconvenios_recaudo: 'barcode' as const },
    { codigoconvenios_recaudo: 'ACUEDUCTO_BOG', nombreconvenios_recaudo: 'Acueducto de Bogotá',               tipo_apiconvenios_recaudo: 'barcode' as const },
    { codigoconvenios_recaudo: 'IMPUESTOS_DIAN', nombreconvenios_recaudo: 'Pagos DIAN Impuestos',             tipo_apiconvenios_recaudo: 'rest' as const },
  ]

  for (const c of conveniosData) {
    const convenio = await prisma.convenioRecaudo.upsert({
      where: { codigoconvenios_recaudo: c.codigoconvenios_recaudo },
      update: {},
      create: { ...c, activoconvenios_recaudo: true },
    })
    for (const suc of sucursales) {
      await prisma.convenioSucursal.upsert({
        where: {
          sucursales_idsucursales_convenios_recaudo_idconvenios_recaudo: {
            sucursales_idsucursales: suc.idsucursales,
            convenios_recaudo_idconvenios_recaudo: convenio.idconvenios_recaudo,
          },
        },
        update: {},
        create: {
          sucursales_idsucursales: suc.idsucursales,
          convenios_recaudo_idconvenios_recaudo: convenio.idconvenios_recaudo,
          activoconvenios_sucursal: true,
        },
      })
    }
  }
  console.log(`✓ Convenios de recaudo: ${conveniosData.length} convenios`)

  // ── 17. CAJAS PADRES Y AUXILIARES ────────────────────────────────────────
  const cajasPlan: Array<{
    sucursal:    typeof sucPrincipal
    nombre:      string
    baseGeneral: string
    horaReset:   Date
    auxiliares:  Array<{ codigo: string; nombre: string; tipo: 'general' | 'pos' | 'menor' | 'pagos'; baseDia: string; limiteAlerta?: string }>
  }> = [
    {
      sucursal:    sucPrincipal,
      nombre:      'Punto Bogotá Centro',
      baseGeneral: '5000000',
      horaReset:   (() => { const d = new Date(0); d.setUTCHours(8, 0, 0, 0); return d })(),
      auxiliares: [
        { codigo: 'CF-BOG-001',     nombre: 'Caja Fuerte',  tipo: 'general', baseDia: '5000000' },
        { codigo: 'POS-BOG-001-01', nombre: 'POS 1',        tipo: 'pos',     baseDia: '500000',  limiteAlerta: '100000' },
        { codigo: 'CM-BOG-001',     nombre: 'Caja Menor',   tipo: 'menor',   baseDia: '200000' },
        { codigo: 'PAG-BOG-001',    nombre: 'Caja Pagos',   tipo: 'pagos',   baseDia: '2000000' },
      ],
    },
    {
      sucursal:    sucNorte,
      nombre:      'Punto Bogotá Norte',
      baseGeneral: '3000000',
      horaReset:   (() => { const d = new Date(0); d.setUTCHours(8, 0, 0, 0); return d })(),
      auxiliares: [
        { codigo: 'CF-BOG-002',     nombre: 'Caja Fuerte', tipo: 'general', baseDia: '3000000' },
        { codigo: 'POS-BOG-002-01', nombre: 'POS 1',       tipo: 'pos',     baseDia: '300000', limiteAlerta: '80000' },
        { codigo: 'CM-BOG-002',     nombre: 'Caja Menor',  tipo: 'menor',   baseDia: '150000' },
      ],
    },
    {
      sucursal:    sucMed,
      nombre:      'Punto Medellín El Poblado',
      baseGeneral: '3000000',
      horaReset:   (() => { const d = new Date(0); d.setUTCHours(8, 0, 0, 0); return d })(),
      auxiliares: [
        { codigo: 'CF-MED-001',     nombre: 'Caja Fuerte', tipo: 'general', baseDia: '3000000' },
        { codigo: 'POS-MED-001-01', nombre: 'POS 1',       tipo: 'pos',     baseDia: '300000', limiteAlerta: '80000' },
        { codigo: 'CM-MED-001',     nombre: 'Caja Menor',  tipo: 'menor',   baseDia: '150000' },
      ],
    },
  ]

  for (const plan of cajasPlan) {
    let cajaPadre = await prisma.cajaPadre.findFirst({
      where: { sucursales_idsucursales: plan.sucursal.idsucursales, deleted_atcajas_padres: null },
    })
    if (!cajaPadre) {
      cajaPadre = await prisma.cajaPadre.create({
        data: {
          sucursales_idsucursales:  plan.sucursal.idsucursales,
          nombrecajas_padres:       plan.nombre,
          base_generalcajas_padres: plan.baseGeneral,
          hora_resetcajas_padres:   plan.horaReset,
        },
      })
    }

    for (const aux of plan.auxiliares) {
      await prisma.caja.upsert({
        where: {
          codigocajas_sucursales_idsucursales: {
            codigocajas:             aux.codigo,
            sucursales_idsucursales: plan.sucursal.idsucursales,
          },
        },
        update: {
          cajas_padres_idcajas_padres: cajaPadre.idcajas_padres,
          tipocajas:                   aux.tipo,
          base_diacajas:               aux.baseDia,
          limite_alertacajas:          aux.limiteAlerta ?? null,
          activocajas:                 true,
        },
        create: {
          sucursales_idsucursales:     plan.sucursal.idsucursales,
          cajas_padres_idcajas_padres: cajaPadre.idcajas_padres,
          codigocajas:                 aux.codigo,
          nombrecajas:                 aux.nombre,
          tipocajas:                   aux.tipo,
          base_diacajas:               aux.baseDia,
          limite_alertacajas:          aux.limiteAlerta ?? null,
          activocajas:                 true,
        },
      })
    }
    console.log(`✓ Cajas ${plan.nombre}: ${plan.auxiliares.length} cajas`)
  }

  // ── 20. APARTADOS POSTALES ───────────────────────────────────────────────
  // Catálogo real de casillas — tarifa $54.800, sin IVA (tabla SIGMA).
  // Asignadas a las 3 sucursales seed. Se eliminan las libres (sin cliente) antes de recrear.
  const CASILLAS_REALES = [
    '102192', '149', '17118', '18383', '18416', '18417', '18418', '18419',
    '18425', '18426', '18427', '201863', '2584', '358368', '358369', '358371',
    '358372', '358373', '358374', '358375', '360662', '360709', '360760',
    '360761', '360762', '360763', '360764', '360765', '360766', '360767',
    '360768', '360769', '360770', '360771', '360773', '360774', '360776',
    '360777', '360779', '360781', '360782', '360783', '360787', '360788',
    '360789', '360790', '360791', '360792', '360793', '360794', '360795',
    '360796', '360797', '360799', '360800', '360803', '360804', '360806',
    '360809', '360810', '360812', '360813', '360815', '360816', '360817',
    '360818', '360820', '360830', '360831', '360833', '360838', '360839',
    '360840', '360842', '360843', '360845', '360850', '360851', '360852',
    '360853', '360854', '360855', '360856', '360857', '360858', '360859',
    '360860', '360861', '360862', '360863', '360864', '360865', '360866',
    '360867', '360868', '360869', '360870', '360872', '360873', '360874',
    '360875', '360876', '360877', '360878', '360879', '361855', '361856',
    '361857', '361859', '361860', '361861', '361862', '361863', '361864',
    '361865', '361866', '361867', '361868', '361869', '361871', '361872',
    '361873', '361874', '361875', '361876', '361877', '361878', '361880',
    '361881', '361882', '361884', '361885', '361886', '361887', '361888',
    '361889', '361892', '361893', '361896', '361898', '361899', '361900',
    '361901', '361903', '361905', '361906', '361907', '361908', '361909',
    '361910', '361912', '361913', '361914', '361915', '361916', '361917',
    '361918', '361919', '361920', '361921', '361922', '361923', '361924',
    '361925', '361926', '361927', '361928', '361929', '361930', '361931',
    '361932', '361933', '361934', '361935', '361936', '361937', '361938',
    '361939', '361940', '361941', '361942', '361943', '361944', '361945',
    '361946', '361947', '361948', '361949', '361950', '361951', '361952',
    '361953', '361954', '361955', '361956', '361957', '57712', '57713',
    '7-1-200277', '7-1-200294', '7067002', '853001', '93953',
    'AA 18282', 'AA 51224', 'AA 853011', 'AA076478', 'AA100178', 'AA1110',
    'AA11383', 'AA12058', 'AA13729', 'AA13820', 'AA13884', 'AA14331',
    'AA16257', 'AA18186', 'AA18470', 'AA19585', 'AA20220', 'AA20262',
    'AA20485', 'AA20726', 'AA22716', 'AA23003', 'AA2323', 'AA240868',
    'AA24607', 'AA250316', 'AA25379', 'AA26152', 'AA27396', 'AA2762',
    'AA30197', 'AA31147', 'AA33398', 'AA34225', 'AA355077', 'AA36162',
    'AA3784', 'AA46794', 'AA49132', 'AA50818', 'AA51146', 'AA51350',
    'AA52291', 'AA54725', 'AA54860', 'AA55700', 'AA7189', 'AA7438',
    'AA75146', 'AA75784', 'AA75874', 'AA75976', 'AA77092', 'AA7744',
    'AA80333', 'AA8224', 'AA842', 'AA8655', 'AA8691', 'AA8852', 'AA9079',
    'AP 150072', 'AP7189',
  ]

  for (const suc of sucursales) {
    await prisma.apartadoPostal.deleteMany({
      where: { sucursales_idsucursales: suc.idsucursales, clientes_idclientes: null },
    })
    const { count } = await prisma.apartadoPostal.createMany({
      data: CASILLAS_REALES.map(numero => ({
        sucursales_idsucursales:       suc.idsucursales,
        numeroapartados_postales:      numero,
        tamanoapartados_postales:      'pequeno' as const,
        estadoapartados_postales:      'disponible' as const,
        valorapartados_postales:       '54800',
        incluye_ivaapartados_postales: false,
      })),
      skipDuplicates: true,
    })
    console.log(`✓ Apartados postales: ${count} casillas en ${suc.nombresucursales}`)
  }

  console.log('\n✅ Seed completado exitosamente.')
  console.log('━'.repeat(50))
  console.log(`🏢 Comercio:  ${comercio.nombrecomercios} (NIT: ${comercio.nitcomercios})`)
  console.log(`👤 Admin seed:    ${adminUser.emailusuarios}`)
  console.log(`👤 Cajero seed:   ${cajero.emailusuarios}`)
  console.log(`👤 Vendedor seed: ${vendedor.emailusuarios}`)
  console.log(`🏪 Sucursales: ${sucursales.map(s => s.nombresucursales).join(' | ')}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
