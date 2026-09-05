-- La auditoría pasó a MongoDB: `audit_events` (NIVEL 1, operación de negocio) y
-- `db_changes` (NIVEL 4, cambio de fila), correlacionadas por `request_id`.
-- Respaldo previo: backups/pos472/postgres/pos_472_full_pre-drop-audit-2_20260904_152528.dump

DROP TABLE IF EXISTS "eventos_auditoria";

DROP TYPE IF EXISTS "operacion_auditoria";
