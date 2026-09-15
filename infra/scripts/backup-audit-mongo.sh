#!/usr/bin/env bash
# backup-audit-mongo.sh — Backup de MongoDB pos472_audit cada 2 días
# Uso: ./infra/scripts/backup-audit-mongo.sh
# Cron recomendado (cada 2 días a las 02:00):
#   0 2 */2 * * /ruta/completa/infra/scripts/backup-audit-mongo.sh >> /var/log/pos472-mongo-backup.log 2>&1

set -euo pipefail

# ── Configuración ────────────────────────────────────────────────────────────
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-pos472_mongo}"
MONGO_PASS="${MONGO_PASS:-pos472_mongo_pass}"
MONGO_DB="${MONGO_DB:-pos472_audit}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/pos472/mongo}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="audit_backup_${TIMESTAMP}"
CONTAINER_NAME="${CONTAINER_NAME:-pos472_mongo}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Iniciando backup MongoDB — ${MONGO_DB}"

# ── Crear directorio de backup si no existe ──────────────────────────────────
mkdir -p "${BACKUP_DIR}"

# ── Ejecutar mongodump dentro del contenedor Docker ──────────────────────────
docker exec "${CONTAINER_NAME}" mongodump \
  --host "localhost:${MONGO_PORT}" \
  --username "${MONGO_USER}" \
  --password "${MONGO_PASS}" \
  --authenticationDatabase admin \
  --db "${MONGO_DB}" \
  --out "/tmp/${BACKUP_NAME}" \
  --quiet

# ── Copiar el dump desde el contenedor al host ───────────────────────────────
docker cp "${CONTAINER_NAME}:/tmp/${BACKUP_NAME}" "${BACKUP_DIR}/${BACKUP_NAME}"

# ── Comprimir ────────────────────────────────────────────────────────────────
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_DIR:?}/${BACKUP_NAME}"

# ── Limpiar backup temporal del contenedor ───────────────────────────────────
docker exec "${CONTAINER_NAME}" rm -rf "/tmp/${BACKUP_NAME}"

BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup completado: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# ── Eliminar backups más antiguos que RETAIN_DAYS ───────────────────────────
DELETED=$(find "${BACKUP_DIR}" -name "audit_backup_*.tar.gz" -mtime "+${RETAIN_DAYS}" -print -delete | wc -l)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backups eliminados por retención (>${RETAIN_DAYS} días): ${DELETED}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup finalizado exitosamente"
