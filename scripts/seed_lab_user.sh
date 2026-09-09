#!/usr/bin/env bash
# Crea / actualiza el usuario admin del Lab en MongoDB.
# Uso: ./scripts/seed_lab_user.sh [usuario] [contraseña] [rol]
# Requiere: contenedor pos472_mongo corriendo.
# El hash se genera via node local (apps/server) o dentro del contenedor del server si está activo.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/../apps/server" && pwd)"

USUARIO="${1:-lab_admin}"
CONTRASENA="${2:-lab472dev}"
ROL="${3:-admin}"

echo "==> Generando hash bcrypt para '${USUARIO}'…"

# Intenta con el contenedor del server; si no corre, usa node local
if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "pos472_server"; then
  HASH=$(docker exec pos472_server node -e "
    const { hashSync } = require('@node-rs/bcrypt');
    process.stdout.write(hashSync('${CONTRASENA}', 10));
  ")
else
  HASH=$(cd "${SERVER_DIR}" && node -e "
    const { hashSync } = require('@node-rs/bcrypt');
    process.stdout.write(hashSync('${CONTRASENA}', 10));
  " 2>/dev/null || true)
fi

if [[ -z "${HASH}" ]]; then
  echo "ERROR: No se pudo generar el hash. Asegúrate de que el server esté corriendo o que node_modules estén instalados en apps/server."
  exit 1
fi

echo "==> Hash generado (${#HASH} chars)"
echo "==> Insertando usuario '${USUARIO}' en MongoDB…"

docker exec pos472_mongo mongosh "mongodb://pos472_mongo:pos472_mongo_pass@localhost:27017/pos472_audit?authSource=admin" --quiet --eval "
db.lab_users.updateOne(
  { usuario: '${USUARIO}' },
  { \$set: {
      usuario:         '${USUARIO}',
      contraseña_hash: '${HASH}',
      rol:             '${ROL}',
      activo:          true,
      updatedAt:       new Date()
  }},
  { upsert: true }
);
print('OK: usuario Lab listo → ${USUARIO} / rol: ${ROL}');
"

echo ""
echo "==> Credenciales para /lab/login:"
echo "    Usuario:    ${USUARIO}"
echo "    Contraseña: ${CONTRASENA}"
