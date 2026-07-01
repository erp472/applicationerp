# Monitoreo — POS 4-72

Stack de observabilidad para el sistema POS 4-72 Servicios Postales Nacionales.

## Componentes

| Servicio | Puerto | Descripción |
|---------|--------|-------------|
| **Prometheus** | `9090` | Recolección y almacenamiento de métricas |
| **Grafana** | `3002` | Dashboards y alertas |
| **node_exporter** | `9100` (host) | Métricas de CPU, RAM, disco y red del servidor |
| **Loki** | `3100` | Agregación de logs (config lista, pendiente integrar al compose) |
| **Promtail** | `9080` | Colector de logs Docker → Loki |

---

## Cómo levantar

> **Pre-requisitos:** Docker Desktop corriendo, PostgreSQL local en puerto 5432, backend `apps/server` compilado.

Desde la raíz del proyecto (`/proyectos/472/`):

```bash
# Levantar todo el stack de monitoreo
docker compose -f docker-compose.monitoring.yml up -d

# Ver logs de un servicio específico
docker compose -f docker-compose.monitoring.yml logs -f prometheus
docker compose -f docker-compose.monitoring.yml logs -f grafana

# Verificar que los servicios están healthy
docker compose -f docker-compose.monitoring.yml ps

# Detener
docker compose -f docker-compose.monitoring.yml down
```

### Acceso a Grafana

```
URL:      http://localhost:3002
Usuario:  admin
Password: grafana472
```

### Verificar que Prometheus recibe métricas

```
http://localhost:9090/targets
```

Deben aparecer en estado **UP**:
- `pos472-api` → `api:3000/metrics`
- `node-exporter` → `host.docker.internal:9100`

---

## Dashboards instalados

Los dashboards se cargan automáticamente desde `infra/grafana/dashboards/` al levantar Grafana.

### 1. `4-72 POS — Servidor` (`server-metrics.json`)
Panel de salud de la infraestructura. Refresco: 15s.

| Panel | Métrica | Alerta sugerida |
|-------|---------|-----------------|
| CPU % | `100 - avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100` | > 85% por 5 min |
| RAM usada % | `100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)` | > 90% |
| Disco usado % | `100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100)` | > 90% |
| Heap Node.js | `pos472_nodejs_heap_size_used_bytes` | > 400 MB |

### 2. `4-72 POS — Auditorías` (`audit-logs.json`)
Vista operativa de seguridad desde PostgreSQL. Refresco: 30s.

| Panel | SQL |
|-------|-----|
| Total eventos | `SELECT COUNT(*) FROM audit_logs WHERE created_at BETWEEN $__timeFrom() AND $__timeTo()` |
| Errores | `... WHERE resultado = 'ERROR' ...` |
| Logins OK | `... WHERE accion = 'LOGIN' AND resultado = 'OK' ...` |
| Usuarios activos | `COUNT(DISTINCT usuario_id) WHERE accion = 'LOGIN' ...` |

---

## Métricas recomendadas para agregar a Grafana

### Performance del API (Prometheus · datasource `pos472_prom`)

Estas métricas las expone el backend NestJS en `GET /metrics` vía `@willsoto/nestjs-prometheus`.

```promql
# Requests por segundo (general)
sum(rate(pos472_http_requests_total[1m]))

# Tasa de error 5xx (%)
100 * sum(rate(pos472_http_requests_total{status=~"5.."}[5m]))
   / sum(rate(pos472_http_requests_total[5m]))

# Latencia p50 / p95 / p99 por ruta
histogram_quantile(0.95,
  sum by (route, le)(rate(pos472_http_request_duration_seconds_bucket[5m]))
)

# Requests activos en este momento
pos472_http_requests_in_flight

# Conexiones WebSocket activas
pos472_ws_connections_active

# Event loop lag p99 (indicador de bloqueo)
histogram_quantile(0.99,
  rate(pos472_nodejs_eventloop_lag_seconds_bucket[5m])
)

# GC pause (Node.js)
rate(pos472_nodejs_gc_duration_seconds_sum[5m])
```

**Dashboard sugerido:** crear panel tipo `Time series` con las rutas más críticas:
- `POST /auth/login` — latencia de autenticación
- `GET /users` — listado más consultado
- `POST /devices/heartbeat` — volumen esperado alto

---

### Negocio / KPIs (PostgreSQL · datasource `pos472_pg`)

```sql
-- Intentos de login fallidos en la última hora (detección de fuerza bruta)
SELECT
  DATE_TRUNC('minute', created_at) AS time,
  COUNT(*) AS intentos_fallidos
FROM audit_logs
WHERE accion = 'LOGIN'
  AND resultado = 'ERROR'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY 1
ORDER BY 1;

-- Equipos con heartbeat activo (últimos 5 min)
SELECT COUNT(DISTINCT mac_address) AS equipos_online
FROM audit_logs
WHERE accion = 'HEARTBEAT'
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Acciones por rol (últimas 24h)
SELECT u.rol, a.accion, COUNT(*) AS total
FROM audit_logs a
JOIN usuarios u ON u.id = a.usuario_id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
GROUP BY u.rol, a.accion
ORDER BY total DESC;

-- Usuarios con más errores (posible cuenta comprometida)
SELECT usuario_id, COUNT(*) AS errores
FROM audit_logs
WHERE resultado = 'ERROR'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY usuario_id
ORDER BY errores DESC
LIMIT 10;

-- Top rutas más lentas (si el backend las registra)
SELECT entidad, AVG(CAST(datos_despues->>'duracion_ms' AS FLOAT)) AS latencia_avg
FROM audit_logs
WHERE datos_despues->>'duracion_ms' IS NOT NULL
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY entidad
ORDER BY latencia_avg DESC;
```

---

### Alertas críticas sugeridas (Grafana Alerting)

Configurar en **Grafana → Alerting → Alert rules**:

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| API caída | `up{job="pos472-api"} == 0` por 1 min | 🔴 Crítico |
| Error rate alta | Tasa 5xx > 5% por 5 min | 🔴 Crítico |
| Latencia p95 alta | `histogram_quantile(0.95, ...) > 2s` por 3 min | 🟡 Warning |
| Heap alto | `pos472_nodejs_heap_size_used_bytes > 400MB` | 🟡 Warning |
| CPU sostenida | CPU > 85% por 5 min | 🟡 Warning |
| Disco lleno | Disco > 90% | 🔴 Crítico |
| Logins fallidos | > 10 en 5 min desde la misma IP | 🔴 Seguridad |
| Equipo sin heartbeat | Sin heartbeat > 10 min en horario laboral | 🟡 Warning |

---

## Agregar Loki (logs de contenedores)

Los archivos de configuración están listos en este directorio. Para activarlos hay que extender el `docker-compose.monitoring.yml`:

```yaml
# Agregar a docker-compose.monitoring.yml:

  loki:
    image: grafana/loki:3.0.0
    container_name: pos472_loki
    ports:
      - "3100:3100"
    volumes:
      - ./apps/monitoring/loki-config.yml:/etc/loki/config.yml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/config.yml

  promtail:
    image: grafana/promtail:3.0.0
    container_name: pos472_promtail
    volumes:
      - ./apps/monitoring/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki

volumes:
  loki_data:   # agregar a la sección volumes existente
```

Y agregar el datasource Loki en `infra/grafana/provisioning/datasources/`:

```yaml
# loki.yml
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    uid: pos472_loki
    url: http://loki:3100
    editable: false
```

Una vez activo, en Grafana → Explore → Loki puedes buscar:

```logql
# Logs del API con errores
{container_name="pos472_api"} |= "ERROR"

# Logs de login fallido
{container_name="pos472_api"} | json | level="error" | message=~"credencial|unauthorized"

# Todos los logs de un trace_id específico
{container_name="pos472_api"} | json | trace_id="abc123"
```

---

## Estructura de archivos

```
apps/monitoring/
├── README.md                          ← este archivo
├── loki-config.yml                    ← config Loki (pendiente integrar)
├── promtail-config.yml                ← recolector logs Docker (pendiente integrar)
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasources.yml        ← Prometheus + Loki + Jaeger + PostgreSQL
        └── dashboards/
            ├── dashboards.yml
            ├── pos472-performance.json ← HTTP metrics + Node.js runtime
            └── pos472-auditoria.json   ← Auditoría desde PostgreSQL

infra/                                 ← configs activas en docker-compose.monitoring.yml
├── prometheus/prometheus.yml
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   ├── prometheus.yml
    │   │   └── postgres.yml
    │   └── dashboards/default.yml
    └── dashboards/
        ├── server-metrics.json        ← CPU / RAM / disco / Heap
        └── audit-logs.json            ← Auditoría operativa
```

---

## Variables de entorno relevantes

El backend debe tener configurada la exposición de métricas:

```env
# apps/server/.env
METRICS_ENABLED=true          # habilita GET /metrics
METRICS_PREFIX=pos472_        # prefijo de todas las métricas
```

Si usas `@willsoto/nestjs-prometheus` o `prom-client`, las métricas de Node.js
(`heap`, `gc`, `event_loop`) se registran automáticamente con
`collectDefaultMetrics({ prefix: 'pos472_' })`.
