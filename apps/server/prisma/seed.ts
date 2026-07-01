import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...')

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
        regionales_idregionales: regBogota.idregionales,
        codigosucursales: 'SUC-BOG-001',
        nombresucursales: 'Bogotá Centro',
        ciudadsucursales: 'Bogotá',
        departamentosucursales: 'Cundinamarca',
        direccionsucursales: 'Carrera 7 # 16-36',
        tiposucursales: 'multipuesto',
        telefonosucursales: '6017447000',
        emailsucursales: 'bogotacentro@4-72.com.co',
        activosucursales: true,
      },
    }),
    prisma.sucursal.upsert({
      where: { codigosucursales: 'SUC-BOG-002' },
      update: {},
      create: {
        regionales_idregionales: regBogota.idregionales,
        codigosucursales: 'SUC-BOG-002',
        nombresucursales: 'Bogotá Norte',
        ciudadsucursales: 'Bogotá',
        departamentosucursales: 'Cundinamarca',
        direccionsucursales: 'Calle 127 # 15-05',
        tiposucursales: 'unipersonal',
        emailsucursales: 'bogotanorte@4-72.com.co',
        activosucursales: true,
      },
    }),
    prisma.sucursal.upsert({
      where: { codigosucursales: 'SUC-MED-001' },
      update: {},
      create: {
        regionales_idregionales: regMedellin.idregionales,
        codigosucursales: 'SUC-MED-001',
        nombresucursales: 'Medellín El Poblado',
        ciudadsucursales: 'Medellín',
        departamentosucursales: 'Antioquia',
        direccionsucursales: 'Carrera 43A # 18-17',
        tiposucursales: 'unipersonal',
        emailsucursales: 'medellinpoblado@4-72.com.co',
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
  const passwordHash = await hash('Admin@4-72!', 10)

  const adminUser = await prisma.usuario.upsert({
    where: { emailusuarios: 'admin@4-72.com.co' },
    update: {},
    create: {
      sucursales_idsucursales: null,
      roles_idroles: roles['ADMIN_SISTEMA'].idroles,
      nombreusuarios: 'Administrador del Sistema',
      emailusuarios: 'admin@4-72.com.co',
      password_hashusuarios: passwordHash,
      activousuarios: true,
    },
  })

  const cajeroHash = await hash('Cajero@4-72!', 10)
  const cajero = await prisma.usuario.upsert({
    where: { emailusuarios: 'cajero.bogota@4-72.com.co' },
    update: {},
    create: {
      sucursales_idsucursales: sucPrincipal.idsucursales,
      roles_idroles: roles['CAJERO'].idroles,
      nombreusuarios: 'Cajero Bogotá Centro',
      emailusuarios: 'cajero.bogota@4-72.com.co',
      password_hashusuarios: cajeroHash,
      activousuarios: true,
    },
  })
  console.log(`✓ Usuarios: ${adminUser.emailusuarios}, ${cajero.emailusuarios}`)

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
    { codigoproductos: 'EST-20',   nombreproductos: 'Estampilla $20',         tipoproductos: 'estampilla' as const, precioproductos: 20,    porcentaje_taxproductos: 0 },
    { codigoproductos: 'EST-50',   nombreproductos: 'Estampilla $50',         tipoproductos: 'estampilla' as const, precioproductos: 50,    porcentaje_taxproductos: 0 },
    { codigoproductos: 'EST-100',  nombreproductos: 'Estampilla $100',        tipoproductos: 'estampilla' as const, precioproductos: 100,   porcentaje_taxproductos: 0 },
    { codigoproductos: 'EST-200',  nombreproductos: 'Estampilla $200',        tipoproductos: 'estampilla' as const, precioproductos: 200,   porcentaje_taxproductos: 0 },
    { codigoproductos: 'EST-500',  nombreproductos: 'Estampilla $500',        tipoproductos: 'estampilla' as const, precioproductos: 500,   porcentaje_taxproductos: 0 },
    { codigoproductos: 'EMP-SOBRE', nombreproductos: 'Sobre 4-72 Estándar',  tipoproductos: 'empaque' as const,    precioproductos: 500,   porcentaje_taxproductos: 0 },
    { codigoproductos: 'EMP-CAJA-P', nombreproductos: 'Caja Pequeña 4-72',  tipoproductos: 'empaque' as const,    precioproductos: 1500,  porcentaje_taxproductos: 0 },
    { codigoproductos: 'EMP-CAJA-M', nombreproductos: 'Caja Mediana 4-72',  tipoproductos: 'empaque' as const,    precioproductos: 2500,  porcentaje_taxproductos: 0 },
    { codigoproductos: 'EMP-CAJA-G', nombreproductos: 'Caja Grande 4-72',   tipoproductos: 'empaque' as const,    precioproductos: 3500,  porcentaje_taxproductos: 0 },
    { codigoproductos: 'PAPEL-BOND', nombreproductos: 'Papel Bond A4 (500h)', tipoproductos: 'material_oficina' as const, precioproductos: 15000, porcentaje_taxproductos: 19 },
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
    {
      codigoservicios: 'NAL-ESTANDAR',
      nombreservicios: 'Nacional Estándar',
      descripcionservicios: 'Envío nacional con entrega en 3 a 5 días hábiles',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 5,
      codigo_sigmaservicios: 'NE',
    },
    {
      codigoservicios: 'NAL-EXPRESS',
      nombreservicios: 'Nacional Express',
      descripcionservicios: 'Envío nacional con entrega en 1 a 2 días hábiles',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: false,
      peso_maximo_kgservicios: 30,
      tiempo_entrega_diasservicios: 2,
      codigo_sigmaservicios: 'NX',
    },
    {
      codigoservicios: 'NAL-CERT',
      nombreservicios: 'Certificado Nacional',
      descripcionservicios: 'Envío certificado con acuse de recibo',
      tiposervicios: 'nacional' as const,
      requiere_estampillaservicios: true,
      requiere_dimensionesservicios: false,
      requiere_valor_declaradoservicios: true,
      peso_maximo_kgservicios: 2,
      tiempo_entrega_diasservicios: 7,
      codigo_sigmaservicios: 'NC',
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
    const servicio = await prisma.servicio.upsert({
      where: { codigoservicios: s.codigoservicios },
      update: {},
      create: { ...s, activoservicios: true },
    })
    servicios[s.codigoservicios] = servicio
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

  // ── 13. TARIFAS DE ENVÍO NACIONAL (básicas) ───────────────────────────────
  const tarifasNalStd = [
    { peso_min: 0,   peso_max: 0.5,  tarifa: 5500 },
    { peso_min: 0.5, peso_max: 1,    tarifa: 7500 },
    { peso_min: 1,   peso_max: 2,    tarifa: 10000 },
    { peso_min: 2,   peso_max: 5,    tarifa: 14000 },
    { peso_min: 5,   peso_max: 10,   tarifa: 22000 },
    { peso_min: 10,  peso_max: 30,   tarifa: 38000, tarifa_kg_adicional: 3000 },
  ]

  for (const t of tarifasNalStd) {
    await prisma.tarifaServicio.create({
      data: {
        servicios_idservicios: servicios['NAL-ESTANDAR'].idservicios,
        pais_destinotarifas_servicio: 'CO',
        peso_min_kgtarifas_servicio: t.peso_min,
        peso_max_kgtarifas_servicio: t.peso_max ?? null,
        tarifatarifas_servicio: t.tarifa,
        tarifa_kg_adicionaltarifas_servicio: (t as { tarifa_kg_adicional?: number }).tarifa_kg_adicional ?? null,
        activatarifas_servicio: true,
      },
    })
  }
  console.log('✓ Tarifas servicio nacional estándar')

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
    for (const [codigo, prod] of Object.entries(productos).filter(([k]) => k.startsWith('EMP-'))) {
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
          cantidad_actualinventario_sucursal: codigo === 'EMP-SOBRE' ? 200 : 50,
          cantidad_minimainventario_sucursal: 10,
        },
      })
    }
  }
  console.log('✓ Inventario inicial para estampillas y empaques')

  // ── 15. FEATURE FLAGS ─────────────────────────────────────────────────────
  const flagsData = [
    { codigofeature_flags: 'facturacion_electronica',  descripcionfeature_flags: 'Habilita facturación electrónica DIAN', activofeature_flags: false, entornofeature_flags: 'all' as const },
    { codigofeature_flags: 'giro_moneygram',           descripcionfeature_flags: 'Habilita giros MoneyGram',              activofeature_flags: false, entornofeature_flags: 'all' as const },
    { codigofeature_flags: 'giro_ria',                 descripcionfeature_flags: 'Habilita giros RIA',                    activofeature_flags: false, entornofeature_flags: 'all' as const },
    { codigofeature_flags: 'recaudo_barcode',          descripcionfeature_flags: 'Lectura de código de barras en recaudo', activofeature_flags: true,  entornofeature_flags: 'all' as const },
    { codigofeature_flags: 'sigma_sync',               descripcionfeature_flags: 'Sincronización automática con SIGMA',   activofeature_flags: false, entornofeature_flags: 'prod' as const },
    { codigofeature_flags: 'inspektor_online',         descripcionfeature_flags: 'Consulta online a Inspektor SAGRILAFT', activofeature_flags: false, entornofeature_flags: 'all' as const },
    { codigofeature_flags: 'cierre_automatico_caja',   descripcionfeature_flags: 'Cierre automático de caja al finalizar turno', activofeature_flags: false, entornofeature_flags: 'all' as const },
  ]

  for (const f of flagsData) {
    await prisma.featureFlag.upsert({
      where: { codigofeature_flags: f.codigofeature_flags },
      update: {},
      create: f,
    })
  }
  console.log(`✓ Feature flags: ${flagsData.length} flags`)

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

  console.log('\n✅ Seed completado exitosamente.')
  console.log('━'.repeat(50))
  console.log(`🏢 Comercio:  ${comercio.nombrecomercios} (NIT: ${comercio.nitcomercios})`)
  console.log(`👤 Admin:     ${adminUser.emailusuarios} / Admin@4-72!`)
  console.log(`👤 Cajero:    ${cajero.emailusuarios} / Cajero@4-72!`)
  console.log(`🏪 Sucursales: ${sucursales.map(s => s.nombresucursales).join(' | ')}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
