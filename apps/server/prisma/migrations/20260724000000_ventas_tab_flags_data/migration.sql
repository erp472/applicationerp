-- Flags de control de tabs en la caja de ventas (CarritoVenta)
-- Idempotente: ON CONFLICT DO UPDATE garantiza que un re-deploy no falle
-- y que activo=true quede fijo (el admin puede desactivarlos vía UI después)

INSERT INTO feature_flags
  (codigofeature_flags, descripcionfeature_flags, activofeature_flags, entornofeature_flags, plataformafeature_flags)
VALUES
  ('ventas:tab_productos',  'Tab Productos en caja de ventas',               true, 'all', 'all'),
  ('ventas:tab_especiales', 'Tab Productos Especiales en caja de ventas',    true, 'all', 'all'),
  ('ventas:tab_apartado',   'Tab Apartados Postales en caja de ventas',      true, 'all', 'all'),
  ('ventas:tab_servicios',  'Tab Servicios Postales en caja de ventas',      true, 'all', 'tauri'),
  ('ventas:tab_historial',  'Tab Historial de ventas en caja',               true, 'all', 'all')
ON CONFLICT (codigofeature_flags) DO UPDATE SET
  activofeature_flags      = EXCLUDED.activofeature_flags,
  entornofeature_flags     = EXCLUDED.entornofeature_flags,
  plataformafeature_flags  = EXCLUDED.plataformafeature_flags;

-- Sin asignación de roles: flags sin restricción → visibles a cualquier rol autenticado.
-- Para restringir a roles específicos usar la UI de Feature Flags o INSERT en feature_flag_roles.
