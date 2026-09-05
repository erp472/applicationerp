#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# mongo_backup_clean.sh — Backup y limpieza de la BD pos472_audit en Docker
#
# Uso:
#   ./scripts/mongo_backup_clean.sh backup          → solo backup
#   ./scripts/mongo_backup_clean.sh clean           → solo limpieza (pide confirmación)
#   ./scripts/mongo_backup_clean.sh backup-and-clean → backup + limpieza
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuración ────────────────────────────────────────────────────────────
CONTAINER="pos472_mongo"
DB="pos472_audit"
MONGO_USER="pos472_mongo"
MONGO_PASS="${MONGO_PASSWORD:-pos472_mongo_pass}"
AUTH_SOURCE="admin"
COLECCIONES=("audit_events" "security_alerts" "db_changes")

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups/mongo"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Verificar que el contenedor esté corriendo ───────────────────────────────
check_container() {
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    err "El contenedor '${CONTAINER}' no está corriendo."
    err "Levántalo con: docker compose -f docker-compose.monitoring.yml up -d mongodb"
    exit 1
  fi
}

# ── Backup ───────────────────────────────────────────────────────────────────
do_backup() {
  log "Iniciando backup de '${DB}' → ${BACKUP_PATH}"
  mkdir -p "${BACKUP_PATH}"

  docker exec "${CONTAINER}" mongodump \
    --username  "${MONGO_USER}" \
    --password  "${MONGO_PASS}" \
    --authenticationDatabase "${AUTH_SOURCE}" \
    --db        "${DB}" \
    --out       "/tmp/mongodump_${TIMESTAMP}"

  docker cp "${CONTAINER}:/tmp/mongodump_${TIMESTAMP}/." "${BACKUP_PATH}/"

  # Limpiar el dump temporal dentro del contenedor
  docker exec "${CONTAINER}" rm -rf "/tmp/mongodump_${TIMESTAMP}"

  # Comprimir
  local archive="${BACKUP_DIR}/${TIMESTAMP}.tar.gz"
  tar -czf "${archive}" -C "${BACKUP_DIR}" "${TIMESTAMP}"
  rm -rf "${BACKUP_PATH}"

  local size
  size=$(du -sh "${archive}" | cut -f1)
  ok "Backup guardado en: ${archive} (${size})"
}

# ── Limpieza completa ────────────────────────────────────────────────────────
do_clean() {
  warn "Esto eliminará TODOS los documentos de las colecciones:"
  for col in "${COLECCIONES[@]}"; do
    echo "    - ${DB}.${col}"
  done
  echo ""
  read -rp "$(echo -e "${RED}¿Confirmar limpieza? Escribe 'LIMPIAR' para continuar: ${NC}")" confirm
  if [[ "${confirm}" != "LIMPIAR" ]]; then
    warn "Limpieza cancelada."
    exit 0
  fi

  log "Limpiando colecciones de '${DB}'..."

  local eval_script=""
  for col in "${COLECCIONES[@]}"; do
    eval_script+="
      var r = db.${col}.deleteMany({});
      print('  ${col}: ' + r.deletedCount + ' documentos eliminados');
    "
  done

  docker exec "${CONTAINER}" mongosh \
    --username  "${MONGO_USER}" \
    --password  "${MONGO_PASS}" \
    --authenticationDatabase "${AUTH_SOURCE}" \
    "${DB}" \
    --quiet \
    --eval "${eval_script}"

  ok "Limpieza completada."
}

# ── Main ─────────────────────────────────────────────────────────────────────
CMD="${1:-}"

case "${CMD}" in
  backup)
    check_container
    do_backup
    ;;
  clean)
    check_container
    do_clean
    ;;
  backup-and-clean)
    check_container
    do_backup
    do_clean
    ;;
  *)
    echo "Uso: $0 {backup|clean|backup-and-clean}"
    echo ""
    echo "  backup           → Respalda la BD completa en backups/mongo/<timestamp>.tar.gz"
    echo "  clean            → Elimina todos los documentos (pide confirmación)"
    echo "  backup-and-clean → Backup primero, luego limpieza"
    exit 1
    ;;
esac
