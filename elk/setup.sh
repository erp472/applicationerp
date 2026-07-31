#!/usr/bin/env bash
# setup.sh — Configuración post-inicio del ELK Stack para pos472
# Ejecutar una vez que todos los servicios estén healthy:
#   bash elk/setup.sh
#
# Requiere: curl, jq

set -euo pipefail

ES_URL="http://localhost:9200"
KB_URL="http://localhost:5601"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD:-pos472_elastic_dev}"
AUTH="elastic:${ELASTIC_PASSWORD}"

GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; NC="\033[0m"
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
fail()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

wait_es() {
  echo "Esperando Elasticsearch..."
  until curl -s -u "$AUTH" "$ES_URL/_cluster/health" | grep -q '"status":"green"\|"status":"yellow"'; do
    sleep 5; printf "."
  done
  echo; info "Elasticsearch listo"
}

wait_kibana() {
  echo "Esperando Kibana..."
  until curl -s "$KB_URL/api/status" | grep -q '"available"'; do
    sleep 5; printf "."
  done
  echo; info "Kibana listo"
}

# ── 1. ILM Policy — rotar índices pos472 cada 7 días, borrar tras 90 ──────────
setup_ilm() {
  curl -s -u "$AUTH" -X PUT "$ES_URL/_ilm/policy/pos472-logs-policy" \
    -H "Content-Type: application/json" -d '{
    "policy": {
      "phases": {
        "hot":    { "min_age": "0ms",  "actions": { "rollover": { "max_age": "7d", "max_primary_shard_size": "5gb" } } },
        "warm":   { "min_age": "7d",   "actions": { "shrink": { "number_of_shards": 1 }, "forcemerge": { "max_num_segments": 1 } } },
        "delete": { "min_age": "90d",  "actions": { "delete": {} } }
      }
    }
  }' > /dev/null
  info "ILM policy pos472-logs-policy creada"
}

# ── 2. Index Template — ECS + campos propios de pos472 ────────────────────────
setup_template() {
  curl -s -u "$AUTH" -X PUT "$ES_URL/_index_template/pos472-logs" \
    -H "Content-Type: application/json" -d '{
    "index_patterns": ["pos472-api-*", "docker-logs-*"],
    "template": {
      "settings": {
        "number_of_shards":   1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "pos472-logs-policy"
      },
      "mappings": {
        "properties": {
          "@timestamp":          { "type": "date" },
          "message":             { "type": "text" },
          "log.level":           { "type": "keyword" },
          "log.logger":          { "type": "keyword" },
          "log.message":         { "type": "text"    },
          "event.category":      { "type": "keyword" },
          "event.type":          { "type": "keyword" },
          "event.outcome":       { "type": "keyword" },
          "event.dataset":       { "type": "keyword" },
          "service.name":        { "type": "keyword" },
          "environment":         { "type": "keyword" },
          "container.name":      { "type": "keyword" },
          "container.id":        { "type": "keyword" },
          "tags":                { "type": "keyword" },
          "process.pid":         { "type": "integer" },
          "app.userId":          { "type": "keyword" },
          "app.sucursalId":      { "type": "integer" },
          "app.cajaPadreId":     { "type": "integer" },
          "app.monto":           { "type": "scaled_float", "scaling_factor": 100 },
          "app.tipoMovimiento":  { "type": "keyword" },
          "app.req.url":         { "type": "keyword" },
          "app.req.method":      { "type": "keyword" },
          "app.res.statusCode":  { "type": "integer" },
          "app.responseTime":    { "type": "integer" }
        }
      }
    },
    "priority": 200
  }' > /dev/null
  info "Index template pos472-logs creado"
}

# ── 3. Data View en Kibana ─────────────────────────────────────────────────────
setup_dataview() {
  curl -s -u "$AUTH" -X POST "$KB_URL/api/data_views/data_view" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "data_view": {
      "title":       "pos472-api-*",
      "name":        "POS 4-72 API Logs",
      "timeFieldName": "@timestamp"
    }
  }' > /dev/null
  curl -s -u "$AUTH" -X POST "$KB_URL/api/data_views/data_view" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "data_view": {
      "title":       "docker-logs-*",
      "name":        "Docker Logs (todos los contenedores)",
      "timeFieldName": "@timestamp"
    }
  }' > /dev/null
  info "Data views creados en Kibana"
}

# ── 4. Reglas de detección SIEM ───────────────────────────────────────────────
setup_rules() {
  # Regla 1: Múltiples fallos de autenticación (brute force)
  curl -s -u "$AUTH" -X POST "$KB_URL/api/detection_engine/rules" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "type": "threshold",
    "name": "[POS472] Brute Force — múltiples fallos de auth",
    "description": "Más de 5 errores de autenticación en 5 minutos desde el mismo origen. Posible ataque de fuerza bruta.",
    "severity": "high",
    "risk_score": 73,
    "enabled": true,
    "index": ["pos472-api-*"],
    "query": "tags: auth_failure",
    "language": "kuery",
    "threshold": { "field": [], "value": 5 },
    "from": "now-5m",
    "interval": "5m",
    "tags": ["pos472", "brute-force", "T1110"],
    "threat": [{
      "framework": "MITRE ATT&CK",
      "tactic": { "id": "TA0006", "name": "Credential Access", "reference": "https://attack.mitre.org/tactics/TA0006" },
      "technique": [{ "id": "T1110", "name": "Brute Force", "reference": "https://attack.mitre.org/techniques/T1110" }]
    }]
  }' > /dev/null

  # Regla 2: Escaneo de rutas (404 repetidos)
  curl -s -u "$AUTH" -X POST "$KB_URL/api/detection_engine/rules" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "type": "threshold",
    "name": "[POS472] Escaneo de endpoints (404 repetidos)",
    "description": "Más de 10 respuestas 404 en 2 minutos. Posible enumeración de endpoints.",
    "severity": "medium",
    "risk_score": 47,
    "enabled": true,
    "index": ["pos472-api-*"],
    "query": "tags: route_not_found",
    "language": "kuery",
    "threshold": { "field": [], "value": 10 },
    "from": "now-2m",
    "interval": "2m",
    "tags": ["pos472", "recon", "T1595"],
    "threat": [{
      "framework": "MITRE ATT&CK",
      "tactic": { "id": "TA0043", "name": "Reconnaissance", "reference": "https://attack.mitre.org/tactics/TA0043" },
      "technique": [{ "id": "T1595", "name": "Active Scanning", "reference": "https://attack.mitre.org/techniques/T1595" }]
    }]
  }' > /dev/null

  # Regla 3: Errores internos persistentes (posible explotación activa)
  curl -s -u "$AUTH" -X POST "$KB_URL/api/detection_engine/rules" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "type": "threshold",
    "name": "[POS472] Errores 5xx persistentes",
    "description": "Más de 3 errores internos del servidor en 1 minuto. Puede indicar explotación activa o payload malformado.",
    "severity": "medium",
    "risk_score": 50,
    "enabled": true,
    "index": ["pos472-api-*"],
    "query": "tags: server_error",
    "language": "kuery",
    "threshold": { "field": [], "value": 3 },
    "from": "now-1m",
    "interval": "1m",
    "tags": ["pos472", "server-error"]
  }' > /dev/null

  # Regla 4: Movimiento de caja fuera de horario (22:00 - 06:00)
  curl -s -u "$AUTH" -X POST "$KB_URL/api/detection_engine/rules" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "type": "query",
    "name": "[POS472] Evento de caja fuera de horario operativo",
    "description": "Apertura, cierre o movimiento de caja registrado fuera del horario operativo (10PM - 6AM). Requiere revisión manual.",
    "severity": "high",
    "risk_score": 65,
    "enabled": true,
    "index": ["pos472-api-*"],
    "query": "tags: caja_event AND @timestamp.hour >= 22 OR @timestamp.hour < 6",
    "language": "kuery",
    "from": "now-15m",
    "interval": "15m",
    "tags": ["pos472", "insider-threat", "caja", "T1078"]
  }' > /dev/null

  # Regla 5: Token JWT usado tras expiración (clock skew / replay attack)
  curl -s -u "$AUTH" -X POST "$KB_URL/api/detection_engine/rules" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" -d '{
    "type": "query",
    "name": "[POS472] Token expirado o inválido detectado",
    "description": "Se detectó un intento de uso de token JWT expirado o inválido. Puede ser replay attack o sesión robada.",
    "severity": "medium",
    "risk_score": 55,
    "enabled": true,
    "index": ["pos472-api-*"],
    "query": "tags: auth_failure AND (log.message: *expired* OR log.message: *invalid*token*)",
    "language": "kuery",
    "from": "now-5m",
    "interval": "5m",
    "tags": ["pos472", "token-replay", "T1550"]
  }' > /dev/null

  info "5 reglas de detección SIEM creadas"
}

# ── Main ───────────────────────────────────────────────────────────────────────
wait_es
setup_ilm
setup_template
wait_kibana
setup_dataview
setup_rules

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
info  "Setup completo — POS 4-72 ELK Stack listo"
echo  "  Kibana:        http://localhost:5601"
echo  "  Usuario:       elastic"
echo  "  Password:      ${ELASTIC_PASSWORD}"
echo  ""
echo  "  Ir a: Security → Rules para ver las 5 reglas"
echo  "        Discover → 'POS 4-72 API Logs' para los logs"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
