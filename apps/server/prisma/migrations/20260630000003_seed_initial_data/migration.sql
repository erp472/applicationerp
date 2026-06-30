-- ============================================================
-- SEED: Datos iniciales del sistema 4-72
-- Contraseña de todos los usuarios semilla: Admin472!
-- Hash generado con bcrypt rounds=12
-- ⚠ CAMBIAR contraseñas antes de usar en staging/prod
-- ============================================================

-- ── 1. MÓDULOS (6) ───────────────────────────────────────────
INSERT INTO "modulos" ("id","nombre","descripcion","orden","activo","createdAt","updatedAt") VALUES
  ('22000001-0000-0000-0000-000000000001','Usuarios','Gestión de cuentas y acceso de operadores',1,true,NOW(),NOW()),
  ('22000001-0000-0000-0000-000000000002','Sucursales','Administración de puntos de servicio postal',2,true,NOW(),NOW()),
  ('22000001-0000-0000-0000-000000000003','Dispositivos','Autorización y control de equipos POS',3,true,NOW(),NOW()),
  ('22000001-0000-0000-0000-000000000004','Cajas y Movimientos','Apertura, cierre y movimientos de caja',4,true,NOW(),NOW()),
  ('22000001-0000-0000-0000-000000000005','Ventas y Envíos','Registro de transacciones postales',5,true,NOW(),NOW()),
  ('22000001-0000-0000-0000-000000000006','Auditoría','Trazabilidad y logs del sistema',6,true,NOW(),NOW())
ON CONFLICT ("id") DO NOTHING;

-- ── 2. PERMISOS (18, 3 por módulo) ───────────────────────────
INSERT INTO "permisos" ("id","nombre","descripcion","activo","moduloId","createdAt","updatedAt") VALUES
  -- Usuarios
  ('33000001-0000-0000-0000-000000000001','usuarios:ver',    'Consultar lista y detalle de usuarios',      true,'22000001-0000-0000-0000-000000000001',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000002','usuarios:crear',  'Crear nuevas cuentas de operador',           true,'22000001-0000-0000-0000-000000000001',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000003','usuarios:gestionar','Editar, desactivar y asignar roles',       true,'22000001-0000-0000-0000-000000000001',NOW(),NOW()),
  -- Sucursales
  ('33000001-0000-0000-0000-000000000004','sucursales:ver',      'Consultar información de sucursales',    true,'22000001-0000-0000-0000-000000000002',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000005','sucursales:crear',    'Registrar nuevas sucursales',            true,'22000001-0000-0000-0000-000000000002',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000006','sucursales:gestionar','Editar y desactivar sucursales',         true,'22000001-0000-0000-0000-000000000002',NOW(),NOW()),
  -- Dispositivos
  ('33000001-0000-0000-0000-000000000007','dispositivos:ver',       'Listar equipos autorizados',          true,'22000001-0000-0000-0000-000000000003',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000008','dispositivos:autorizar', 'Autorizar nuevos equipos POS',        true,'22000001-0000-0000-0000-000000000003',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000009','dispositivos:gestionar', 'Revocar y administrar equipos',       true,'22000001-0000-0000-0000-000000000003',NOW(),NOW()),
  -- Cajas y Movimientos
  ('33000001-0000-0000-0000-000000000010','cajas:ver',       'Consultar saldos y resumen de caja',        true,'22000001-0000-0000-0000-000000000004',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000011','cajas:operar',    'Abrir, cerrar y registrar movimientos',     true,'22000001-0000-0000-0000-000000000004',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000012','cajas:gestionar', 'Reposiciones, consignaciones y cuadres',    true,'22000001-0000-0000-0000-000000000004',NOW(),NOW()),
  -- Ventas y Envíos
  ('33000001-0000-0000-0000-000000000013','ventas:ver',      'Consultar ventas y envíos registrados',     true,'22000001-0000-0000-0000-000000000005',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000014','ventas:crear',    'Registrar nuevas ventas y envíos',          true,'22000001-0000-0000-0000-000000000005',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000015','ventas:gestionar','Anular y ajustar transacciones',            true,'22000001-0000-0000-0000-000000000005',NOW(),NOW()),
  -- Auditoría
  ('33000001-0000-0000-0000-000000000016','auditoria:ver',      'Consultar logs de auditoría',            true,'22000001-0000-0000-0000-000000000006',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000017','auditoria:exportar', 'Exportar reportes de auditoría',         true,'22000001-0000-0000-0000-000000000006',NOW(),NOW()),
  ('33000001-0000-0000-0000-000000000018','auditoria:gestionar','Configurar retención y alertas',         true,'22000001-0000-0000-0000-000000000006',NOW(),NOW())
ON CONFLICT ("id") DO NOTHING;

-- ── 3. ROLES RBAC (7 — corresponden al enum RolUsuario) ──────
INSERT INTO "roles" ("id","nombre","descripcion","activo","createdAt","updatedAt") VALUES
  ('44000001-0000-0000-0000-000000000001','CAJERO',              'Operador de ventanilla: caja y transacciones básicas',  true,NOW(),NOW()),
  ('44000001-0000-0000-0000-000000000002','ADMINISTRATIVO',      'Backoffice: usuarios, ventas y reportes locales',        true,NOW(),NOW()),
  ('44000001-0000-0000-0000-000000000003','TESORERIA',           'Control de fondos, cuadres y consignaciones',            true,NOW(),NOW()),
  ('44000001-0000-0000-0000-000000000004','INVENTARIOS',         'Gestión de stock y artículos postales',                  true,NOW(),NOW()),
  ('44000001-0000-0000-0000-000000000005','SUPERVISOR_REGIONAL', 'Supervisión de sucursal: usuarios, cajas y auditoría',   true,NOW(),NOW()),
  ('44000001-0000-0000-0000-000000000006','ADMIN_NACIONAL',      'Administración de todas las sucursales del país',        true,NOW(),NOW()),
  ('44000001-0000-0000-0000-000000000007','ADMIN_SISTEMA',       'Acceso total: configuración, seguridad y sistema',       true,NOW(),NOW())
ON CONFLICT ("id") DO NOTHING;

-- ── 4. ASIGNACIONES ROL → PERMISOS ───────────────────────────

-- CAJERO: caja básica + ventas
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt") VALUES
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000001','33000001-0000-0000-0000-000000000010',NOW()), -- cajas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000001','33000001-0000-0000-0000-000000000011',NOW()), -- cajas:operar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000001','33000001-0000-0000-0000-000000000013',NOW()), -- ventas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000001','33000001-0000-0000-0000-000000000014',NOW())  -- ventas:crear
ON CONFLICT DO NOTHING;

-- ADMINISTRATIVO: usuarios/sucursales (lectura) + ventas completo
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt") VALUES
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000002','33000001-0000-0000-0000-000000000001',NOW()), -- usuarios:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000002','33000001-0000-0000-0000-000000000004',NOW()), -- sucursales:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000002','33000001-0000-0000-0000-000000000010',NOW()), -- cajas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000002','33000001-0000-0000-0000-000000000013',NOW()), -- ventas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000002','33000001-0000-0000-0000-000000000014',NOW()), -- ventas:crear
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000002','33000001-0000-0000-0000-000000000015',NOW())  -- ventas:gestionar
ON CONFLICT DO NOTHING;

-- TESORERIA: cajas completo + ventas lectura
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt") VALUES
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000003','33000001-0000-0000-0000-000000000010',NOW()), -- cajas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000003','33000001-0000-0000-0000-000000000011',NOW()), -- cajas:operar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000003','33000001-0000-0000-0000-000000000012',NOW()), -- cajas:gestionar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000003','33000001-0000-0000-0000-000000000013',NOW())  -- ventas:ver
ON CONFLICT DO NOTHING;

-- INVENTARIOS: solo lectura de ventas y cajas
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt") VALUES
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000004','33000001-0000-0000-0000-000000000010',NOW()), -- cajas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000004','33000001-0000-0000-0000-000000000013',NOW())  -- ventas:ver
ON CONFLICT DO NOTHING;

-- SUPERVISOR_REGIONAL: todo excepto gestionar sistema
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt") VALUES
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000001',NOW()), -- usuarios:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000002',NOW()), -- usuarios:crear
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000003',NOW()), -- usuarios:gestionar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000004',NOW()), -- sucursales:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000007',NOW()), -- dispositivos:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000008',NOW()), -- dispositivos:autorizar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000010',NOW()), -- cajas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000011',NOW()), -- cajas:operar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000012',NOW()), -- cajas:gestionar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000013',NOW()), -- ventas:ver
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000014',NOW()), -- ventas:crear
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000015',NOW()), -- ventas:gestionar
  (gen_random_uuid(),'44000001-0000-0000-0000-000000000005','33000001-0000-0000-0000-000000000016',NOW())  -- auditoria:ver
ON CONFLICT DO NOTHING;

-- ADMIN_NACIONAL: todo excepto auditoría:gestionar
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt")
  SELECT gen_random_uuid(), '44000001-0000-0000-0000-000000000006', "id", NOW()
  FROM "permisos"
  WHERE "id"::text NOT IN ('33000001-0000-0000-0000-000000000018')
    AND "id"::text LIKE '33000001%'
ON CONFLICT DO NOTHING;

-- ADMIN_SISTEMA: todos los permisos
INSERT INTO "roles_permisos" ("id","rolId","permisoId","createdAt")
  SELECT gen_random_uuid(), '44000001-0000-0000-0000-000000000007', "id", NOW()
  FROM "permisos"
  WHERE "id"::text LIKE '33000001%'
ON CONFLICT DO NOTHING;

-- ── 5. SUCURSALES (3, distintos estados) ─────────────────────
INSERT INTO "sucursales" ("id","codigo","nombre","ciudad","activo","createdAt","updatedAt") VALUES
  ('bb000001-0000-0000-0000-000000000001','BOG-CHP','Sucursal Chapinero',    'Bogotá',   true, NOW(),NOW()),
  ('bb000001-0000-0000-0000-000000000002','MED-CEN','Sucursal Centro',       'Medellín', true, NOW(),NOW()),
  ('bb000001-0000-0000-0000-000000000003','CAL-NOR','Sucursal Norte',        'Cali',     false,NOW(),NOW())  -- inactiva
ON CONFLICT ("id") DO NOTHING;

-- ── 6. USUARIOS (3, roles distintos) ─────────────────────────
-- Contraseña semilla: Admin472!
-- Hash bcrypt rounds=12 — REGENERAR antes de staging/prod
INSERT INTO "usuarios" ("id","nombre","email","passwordHash","rol","sucursalId","activo","createdAt","updatedAt") VALUES
  (
    'cc000001-0000-0000-0000-000000000001',
    'Administrador Sistema',
    'admin@4-72.com.co',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCO8KmJ3pRgfTYYJVkf1MpMUBqCqkq9Eq',
    'ADMIN_SISTEMA',
    NULL,
    true,
    NOW(),NOW()
  ),
  (
    'cc000001-0000-0000-0000-000000000002',
    'Laura Ramírez',
    'lramirez@4-72.com.co',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCO8KmJ3pRgfTYYJVkf1MpMUBqCqkq9Eq',
    'SUPERVISOR_REGIONAL',
    'bb000001-0000-0000-0000-000000000001',
    true,
    NOW(),NOW()
  ),
  (
    'cc000001-0000-0000-0000-000000000003',
    'Carlos Mendoza',
    'cmendoza@4-72.com.co',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCO8KmJ3pRgfTYYJVkf1MpMUBqCqkq9Eq',
    'CAJERO',
    'bb000001-0000-0000-0000-000000000002',
    true,
    NOW(),NOW()
  )
ON CONFLICT ("id") DO NOTHING;

-- ── 7. FEATURE FLAGS (6, estados y entornos variados) ─────────
INSERT INTO "feature_flags" ("id","codigo","descripcion","activo","entorno","createdAt","updatedAt") VALUES
  (gen_random_uuid(), 'caja:cierre_automatico',    'Cierre automático de caja al final del turno',          true, 'all',     NOW(),NOW()),
  (gen_random_uuid(), 'ventas:nueva_ui',            'Interfaz rediseñada para el módulo de ventas',          true, 'dev',     NOW(),NOW()),
  (gen_random_uuid(), 'giros:moneygram',            'Integración MoneyGram para giros internacionales',      true, 'prod',    NOW(),NOW()),
  (gen_random_uuid(), 'facturacion:electronica',    'Emisión de facturas electrónicas vía DIAN',             false,'staging', NOW(),NOW()),
  (gen_random_uuid(), 'inventario:alertas_stock',   'Notificaciones de stock bajo por sucursal',             false,'dev',     NOW(),NOW()),
  (gen_random_uuid(), 'auth:2fa_opcional',          'Autenticación de dos factores opt-in por usuario',      false,'prod',    NOW(),NOW())
ON CONFLICT DO NOTHING;
