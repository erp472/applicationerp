-- Datos iniciales de feature flags: módulos y funcionalidades opcionales
-- Esta migración es idempotente (ON CONFLICT DO UPDATE asegura plataforma correcta en upgrades)

-- ── 1. Insertar los flags ──────────────────────────────────────────────────────
INSERT INTO feature_flags
  (codigofeature_flags, descripcionfeature_flags, activofeature_flags, entornofeature_flags, plataformafeature_flags)
VALUES
  -- Módulos Tauri (POS desktop) — solo accesibles desde la app de escritorio
  ('modulo:caja',       'Módulo de apertura y cierre de caja',                 true,  'all',  'tauri'),
  ('modulo:ventas',     'Módulo de ventas de productos y servicios',            true,  'all',  'tauri'),
  ('modulo:envios',     'Módulo de envíos y guías postales',                   true,  'all',  'tauri'),
  ('modulo:giros',      'Módulo de giros nacionales e internacionales',         true,  'all',  'tauri'),
  ('modulo:recaudos',   'Módulo de recaudo de pagos y convenios',              true,  'all',  'tauri'),
  ('modulo:sacas',      'Módulo de cierre y despacho de sacas',                true,  'all',  'tauri'),
  ('modulo:apartados',  'Módulo de apartados postales',                        true,  'all',  'tauri'),
  ('modulo:inventario', 'Módulo de inventario y órdenes de reposición',        true,  'all',  'tauri'),
  ('modulo:tesoreria',  'Módulo de consignaciones y tesorería',                true,  'all',  'tauri'),
  -- Módulos web — solo accesibles desde el panel web
  ('modulo:reportes',   'Panel de reportes y estadísticas',                    true,  'all',  'web'),
  ('modulo:admin',      'Panel de administración de usuarios y sucursales',    true,  'all',  'web'),
  ('modulo:auditoria',  'Panel de auditoría y trazabilidad',                   true,  'all',  'web'),
  -- Módulo compartido (web y tauri)
  ('modulo:clientes',   'Consulta y gestión de clientes',                      true,  'all',  'all'),
  -- Funcionalidades opcionales (desactivadas por defecto hasta habilitación explícita)
  ('facturacion_electronica', 'Facturación electrónica DIAN',                  false, 'all',  'tauri'),
  ('giro_moneygram',          'Giros MoneyGram',                               false, 'all',  'tauri'),
  ('giro_ria',                'Giros RIA',                                     false, 'all',  'tauri'),
  ('recaudo_barcode',         'Lectura de código de barras en recaudo',        true,  'all',  'tauri'),
  ('sigma_sync',              'Sincronización automática con SIGMA',           false, 'prod', 'tauri'),
  ('inspektor_online',        'Consulta online a Inspektor SAGRILAFT',         false, 'all',  'all'),
  ('cierre_automatico_caja',  'Cierre automático de caja al finalizar turno',  false, 'all',  'tauri')
ON CONFLICT (codigofeature_flags) DO UPDATE SET
  descripcionfeature_flags = EXCLUDED.descripcionfeature_flags,
  entornofeature_flags     = EXCLUDED.entornofeature_flags,
  plataformafeature_flags  = EXCLUDED.plataformafeature_flags;

-- ── 2. Asociar roles a módulos ────────────────────────────────────────────────
-- Patrón: SELECT + JOIN para no depender de IDs hardcodeados

-- modulo:caja → CAJERO, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:caja'
  AND r.codigoroles IN ('CAJERO','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:ventas → CAJERO, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:ventas'
  AND r.codigoroles IN ('CAJERO','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:envios → CAJERO, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:envios'
  AND r.codigoroles IN ('CAJERO','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:giros → CAJERO, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:giros'
  AND r.codigoroles IN ('CAJERO','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:recaudos → CAJERO, TESORERIA, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:recaudos'
  AND r.codigoroles IN ('CAJERO','TESORERIA','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:sacas → CAJERO, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:sacas'
  AND r.codigoroles IN ('CAJERO','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:apartados → CAJERO, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:apartados'
  AND r.codigoroles IN ('CAJERO','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:inventario → INVENTARIOS, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:inventario'
  AND r.codigoroles IN ('INVENTARIOS','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:tesoreria → TESORERIA, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:tesoreria'
  AND r.codigoroles IN ('TESORERIA','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:reportes → TESORERIA, SUPERVISOR_REGIONAL, ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:reportes'
  AND r.codigoroles IN ('TESORERIA','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:admin → ADMIN_NACIONAL, ADMIN_SISTEMA
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:admin'
  AND r.codigoroles IN ('ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:auditoria → ADMIN_SISTEMA únicamente
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:auditoria'
  AND r.codigoroles IN ('ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- modulo:clientes → todos los roles operativos
INSERT INTO feature_flag_roles (feature_flags_idfeature_flags, roles_idroles)
SELECT ff.idfeature_flags, r.idroles
FROM feature_flags ff
CROSS JOIN roles r
WHERE ff.codigofeature_flags = 'modulo:clientes'
  AND r.codigoroles IN ('CAJERO','ADMINISTRATIVO','TESORERIA','INVENTARIOS','SUPERVISOR_REGIONAL','ADMIN_NACIONAL','ADMIN_SISTEMA')
ON CONFLICT DO NOTHING;

-- Las funcionalidades opcionales (facturacion_electronica, giro_*, etc.)
-- no tienen restricción de roles: accesibles a cualquier rol cuando estén activas.
