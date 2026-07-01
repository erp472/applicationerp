/**
 * Factories para pruebas — generan datos sintéticos válidos por modelo.
 * Uso: const data = comercioFactory.build({ nombrecomercios: 'Prueba' })
 *       await prisma.comercio.create({ data })
 */
import { faker } from '@faker-js/faker'

faker.setLocale('es')

// ── Helpers ────────────────────────────────────────────────────────────────

function nit() {
  const num = faker.number.int({ min: 800_000_000, max: 999_999_999 })
  const dv  = faker.number.int({ min: 0, max: 9 })
  return `${num}-${dv}`
}

function cedula() {
  return faker.number.int({ min: 10_000_000, max: 1_999_999_999 }).toString()
}

function telefono() {
  return `${faker.helpers.arrayElement(['601', '602', '604', '605', '606', '607', '608'])}${faker.number.int({ min: 1_000_000, max: 9_999_999 })}`
}

function celular() {
  return `3${faker.number.int({ min: 10_000_000, max: 29_999_999 })}`
}

function codigoPostal() {
  return faker.number.int({ min: 110_000, max: 999_999 }).toString()
}

// ── 1. Jerarquía comercial ────────────────────────────────────────────────

export const comercioFactory = {
  build: (overrides: Record<string, unknown> = {}) => ({
    codigocomercios:     faker.string.alphanumeric(6).toUpperCase(),
    nombrecomercios:     faker.company.name(),
    nitcomercios:        nit(),
    activocomercios:     true,
    ...overrides,
  }),
}

export const regionalFactory = {
  build: (comercios_idcomercios: number, overrides: Record<string, unknown> = {}) => ({
    comercios_idcomercios,
    codigoregionales:    `REG-${faker.string.alphanumeric(5).toUpperCase()}`,
    nombreregionales:    `Regional ${faker.location.city()}`,
    activoregionales:    true,
    ...overrides,
  }),
}

export const sucursalFactory = {
  build: (regionales_idregionales: number, overrides: Record<string, unknown> = {}) => ({
    regionales_idregionales,
    codigosucursales:        `SUC-${faker.string.alphanumeric(7).toUpperCase()}`,
    nombresucursales:        `Sucursal ${faker.location.city()}`,
    ciudadsucursales:        faker.location.city(),
    departamentosucursales:  faker.location.state(),
    direccionsucursales:     faker.location.streetAddress(),
    tiposucursales:          faker.helpers.arrayElement(['unipersonal', 'multipuesto'] as const),
    telefonosucursales:      telefono(),
    emailsucursales:         faker.internet.email(),
    activosucursales:        true,
    ...overrides,
  }),
}

export const equipoAutorizadoFactory = {
  build: (sucursales_idsucursales: number, overrides: Record<string, unknown> = {}) => ({
    sucursales_idsucursales,
    mac_addressequipos_autorizados:      faker.internet.mac(),
    nombreequipos_autorizados:           `PC-${faker.string.alphanumeric(6).toUpperCase()}`,
    sistema_operativoequipos_autorizados: faker.helpers.arrayElement(['windows', 'linux', 'macos'] as const),
    activoequipos_autorizados:           true,
    ...overrides,
  }),
}

// ── 2. Roles y Permisos ────────────────────────────────────────────────────

export const rolFactory = {
  build: (overrides: Record<string, unknown> = {}) => ({
    codigoroles:  faker.string.alphanumeric(8).toUpperCase(),
    nombreroles:  faker.person.jobTitle(),
    activoroles:  true,
    ...overrides,
  }),
}

export const permisoFactory = {
  build: (overrides: Record<string, unknown> = {}) => {
    const modulo = faker.helpers.arrayElement(['ventas', 'caja', 'envios', 'giros', 'admin'])
    const accion = faker.helpers.arrayElement(['crear', 'consultar', 'anular', 'aprobar'])
    return {
      codigopermisos:      `${modulo}:${accion}_${faker.string.alphanumeric(4)}`,
      descripcionpermisos: faker.lorem.sentence(6),
      modulopermisos:      modulo,
      ...overrides,
    }
  },
}

// ── 3. Usuarios ────────────────────────────────────────────────────────────

export const usuarioFactory = {
  build: (roles_idroles: number, overrides: Record<string, unknown> = {}) => ({
    roles_idroles,
    nombreusuarios:        `${faker.person.firstName()} ${faker.person.lastName()}`,
    emailusuarios:         faker.internet.email().toLowerCase(),
    password_hashusuarios: '$2a$10$placeholder_hash_replace_with_bcrypt',
    activousuarios:        true,
    ...overrides,
  }),
}

// ── 4. Tipos de cliente ────────────────────────────────────────────────────

export const tipoClienteFactory = {
  build: (overrides: Record<string, unknown> = {}) => ({
    codigotipos_cliente:               faker.string.alphanumeric(8).toUpperCase(),
    nombretipos_cliente:               faker.commerce.department(),
    descuento_porcentajetipos_cliente: faker.number.float({ min: 0, max: 30, precision: 0.01 }),
    aplica_estampillastipos_cliente:   faker.datatype.boolean(),
    aplica_giros_sisbentipos_cliente:  false,
    activotipos_cliente:               true,
    ...overrides,
  }),
}

// ── 5. Productos ───────────────────────────────────────────────────────────

export const productoFactory = {
  build: (overrides: Record<string, unknown> = {}) => ({
    codigoproductos:         `PROD-${faker.string.alphanumeric(6).toUpperCase()}`,
    nombreproductos:         faker.commerce.productName(),
    descripcionproductos:    faker.commerce.productDescription(),
    tipoproductos:           faker.helpers.arrayElement(['estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro'] as const),
    precioproductos:         faker.number.float({ min: 100, max: 100_000, precision: 0.01 }),
    porcentaje_taxproductos: faker.helpers.arrayElement([0, 5, 19]),
    activoproductos:         true,
    ...overrides,
  }),
}

// ── 6. Servicios ───────────────────────────────────────────────────────────

export const servicioFactory = {
  build: (overrides: Record<string, unknown> = {}) => ({
    codigoservicios:                   `SRV-${faker.string.alphanumeric(6).toUpperCase()}`,
    nombreservicios:                   faker.helpers.arrayElement(['Nacional Express', 'Nacional Estándar', 'Internacional EMS']),
    tiposervicios:                     faker.helpers.arrayElement(['nacional', 'internacional_ms', 'internacional_courier'] as const),
    requiere_estampillaservicios:      faker.datatype.boolean(),
    requiere_dimensionesservicios:     false,
    requiere_valor_declaradoservicios: false,
    peso_maximo_kgservicios:           faker.helpers.arrayElement([2, 5, 10, 30, 70]),
    factor_volumetricoservicios:       2500,
    activoservicios:                   true,
    ...overrides,
  }),
}

// ── 7. Clientes ────────────────────────────────────────────────────────────

export const clienteFactory = {
  build: (overrides: Record<string, unknown> = {}) => ({
    tipo_documentoclientes:   'cedula' as const,
    numero_documentoclientes: cedula(),
    nombreclientes:           faker.person.firstName(),
    apellidoclientes:         faker.person.lastName(),
    emailclientes:            faker.internet.email().toLowerCase(),
    telefonoclientes:         celular(),
    direccionclientes:        faker.location.streetAddress(),
    ciudadclientes:           faker.location.city(),
    codigo_postalclientes:    codigoPostal(),
    activoclientes:           true,
    ...overrides,
  }),
}

// ── 8. Cajas ───────────────────────────────────────────────────────────────

export const cajaPadreFactory = {
  build: (sucursales_idsucursales: number, overrides: Record<string, unknown> = {}) => ({
    sucursales_idsucursales,
    nombrecajas_padres:       'Caja Consolidadora',
    base_generalcajas_padres: 500_000,
    ...overrides,
  }),
}

export const cajaFactory = {
  build: (sucursales_idsucursales: number, overrides: Record<string, unknown> = {}) => ({
    sucursales_idsucursales,
    codigocajas:       `CAJA-${faker.string.alphanumeric(4).toUpperCase()}`,
    nombrecajas:       `Caja ${faker.number.int({ min: 1, max: 20 })}`,
    tipocajas:         'pos' as const,
    base_diacajas:     200_000,
    activocajas:       true,
    ...overrides,
  }),
}

// ── 9. Envíos ──────────────────────────────────────────────────────────────

export const envioFactory = {
  build: (
    sucursales_idsucursales: number,
    usuarios_idusuarios: number,
    servicios_idservicios: number,
    overrides: Record<string, unknown> = {},
  ) => ({
    numero_guiaenvios:         `4720${Date.now()}${faker.string.alphanumeric(4).toUpperCase()}`,
    tipoenvios:                'nacional' as const,
    es_correspondenciaenvios:  false,
    sucursales_idsucursales,
    usuarios_idusuarios,
    servicios_idservicios,
    remitente_nombreenvios:    `${faker.person.firstName()} ${faker.person.lastName()}`,
    remitente_documentoenvios: cedula(),
    remitente_emailenvios:     faker.internet.email().toLowerCase(),
    remitente_telefonoenvios:  celular(),
    remitente_direccionenvios: faker.location.streetAddress(),
    remitente_ciudadenvios:    'Bogotá',
    destinatario_nombreenvios:    `${faker.person.firstName()} ${faker.person.lastName()}`,
    destinatario_documentoenvios: cedula(),
    destinatario_tienen_docenvios: true,
    destinatario_telefonoenvios:  celular(),
    destinatario_direccionenvios: faker.location.streetAddress(),
    destinatario_ciudadenvios:    faker.location.city(),
    destinatario_paisenvios:      'CO',
    peso_fisico_kgenvios:         faker.number.float({ min: 0.1, max: 5, precision: 0.1 }),
    peso_tarificado_kgenvios:     faker.number.float({ min: 0.1, max: 5, precision: 0.1 }),
    valor_servicioenvios:         faker.number.int({ min: 5000, max: 50_000 }),
    valor_estampillasenvios:      0,
    valor_seguroenvios:           0,
    valor_totalenvios:            faker.number.int({ min: 5000, max: 60_000 }),
    estadoenvios:                 'facturado' as const,
    documentos_generadosenvios:   [],
    sincronizado_sigmaenvios:     false,
    ...overrides,
  }),
}

// ── 10. Giros ──────────────────────────────────────────────────────────────

export const giroFactory = {
  build: (
    sucursales_idsucursales: number,
    usuarios_idusuarios: number,
    overrides: Record<string, unknown> = {},
  ) => {
    const monto = faker.number.int({ min: 10_000, max: 2_000_000 })
    const flete = 4700
    return {
      tipogiros:                 'nacional' as const,
      operaciongiros:            'emision' as const,
      sucursales_idsucursales,
      usuarios_idusuarios,
      remitente_tipo_docgiros:   'CC',
      remitente_numero_docgiros: cedula(),
      remitente_nombregiros:     `${faker.person.firstName()} ${faker.person.lastName()}`,
      remitente_ciudadgiros:     faker.location.city(),
      remitente_huellagiros:     false,
      beneficiario_tipo_docgiros:   'CC',
      beneficiario_numero_docgiros: cedula(),
      beneficiario_nombregiros:     `${faker.person.firstName()} ${faker.person.lastName()}`,
      beneficiario_paisgiros:       'CO',
      beneficiario_ciudadgiros:     faker.location.city(),
      monto_copgiros:            monto,
      flete_copgiros:            flete,
      flete_asumido_porgiros:    'remitente' as const,
      monto_total_copgiros:      monto + flete,
      moneda_destinogiros:       'COP',
      consulta_inspektorgiros:   false,
      estadogiros:               'pendiente' as const,
      formulario_5giros:         false,
      declaracion_origengiros:   false,
      fotocopia_cedulagiros:     false,
      reportado_minticgiros:     false,
      ...overrides,
    }
  },
}

// ── 11. Ventas ─────────────────────────────────────────────────────────────

export const ventaFactory = {
  build: (
    sesiones_caja_idsesiones_caja: number,
    usuarios_idusuarios: number,
    overrides: Record<string, unknown> = {},
  ) => {
    const subtotal = faker.number.int({ min: 500, max: 50_000 })
    return {
      sesiones_caja_idsesiones_caja,
      usuarios_idusuarios,
      subtotalventas:  subtotal,
      descuentoventas: 0,
      ivaventas:       0,
      totalventas:     subtotal,
      medio_pagoventas: 'efectivo' as const,
      estadoventas:    'activa' as const,
      ...overrides,
    }
  },
}

// ── 12. Recaudos ───────────────────────────────────────────────────────────

export const recaudoFactory = {
  build: (
    convenios_recaudo_idconvenios_recaudo: number,
    sucursales_idsucursales: number,
    usuarios_idusuarios: number,
    overrides: Record<string, unknown> = {},
  ) => ({
    convenios_recaudo_idconvenios_recaudo,
    sucursales_idsucursales,
    usuarios_idusuarios,
    referencia_pagorecaudos: faker.string.numeric(15),
    codigo_barrasrecaudos:   faker.string.numeric(20),
    montorecaudos:           faker.number.int({ min: 10_000, max: 500_000 }),
    estadorecaudos:          'exitoso' as const,
    ...overrides,
  }),
}

// ── 13. Apartados postales ────────────────────────────────────────────────

export const apartadoPostalFactory = {
  build: (sucursales_idsucursales: number, overrides: Record<string, unknown> = {}) => {
    const inicio = faker.date.soon({ days: 1 })
    const fin = new Date(inicio)
    fin.setFullYear(fin.getFullYear() + 1)
    return {
      sucursales_idsucursales,
      numeroapartados_postales:  faker.string.numeric(4),
      tamanoapartados_postales:  faker.helpers.arrayElement(['pequeno', 'mediano', 'grande'] as const),
      estadoapartados_postales:  'disponible' as const,
      valorapartados_postales:   faker.helpers.arrayElement([45_000, 90_000, 180_000]),
      incluye_ivaapartados_postales: true,
      dias_alerta_vencimientoapartados_postales: 30,
      ...overrides,
    }
  },
}

// ── 14. Sacas ──────────────────────────────────────────────────────────────

export const sacaFactory = {
  build: (
    sucursales_idsucursales: number,
    usuarios_idusuarios: number,
    overrides: Record<string, unknown> = {},
  ) => ({
    numero_precintosacas:   faker.string.numeric(10),
    sucursales_idsucursales,
    usuarios_idusuarios,
    tiposacas:              'nacional' as const,
    tipo_sacasacas:         'consolidada' as const,
    centro_operativo_destinosacas: 'Centro Operativo Bogotá',
    estadosacas:            'abierta' as const,
    total_enviossacas:      0,
    transportista_firmasacas: false,
    ...overrides,
  }),
}
