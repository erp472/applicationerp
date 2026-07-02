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

Los dashboards se cargan automáticamente desde `infra/grafana/dashboards/` al levantar Grafana (`updateIntervalSeconds: 30`, ver `infra/grafana/provisioning/dashboards/default.yml`). **Toda la configuración de Grafana vive únicamente en `infra/`** — ya no existe una copia paralela en `apps/monitoring/grafana` (se eliminó porque nunca estuvo montada en `docker-compose.monitoring.yml` y quedó desincronizada del schema real de la base de datos).

> **Importante:** las tablas reales son `eventos_auditoria` y `usuarios` (Prisma `schema.prisma`), no `audit_logs`/`users`. Los campos `accion`, `resultado` y `error` de cada evento viven dentro del JSONB `datos_despueseventos_auditoria` (`->>'accion'`, `->>'resultado'`, `->>'error'`), no como columnas planas. Todas las queries de los dashboards de abajo ya están adaptadas a esto.

### 1. `4-72 POS — Servidor` (`server-metrics.json`)
Panel de salud de la infraestructura (host). Refresco: 15s.

| Panel | Métrica | Alerta sugerida |
|-------|---------|-----------------|
| CPU % | `100 - avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100` | > 85% por 5 min |
| RAM usada % | `100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)` | > 90% |
| Disco usado % | `100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100)` | > 90% |
| Heap Node.js | `pos472_nodejs_heap_size_used_bytes` | > 400 MB |

### 2. `4-72 POS — Performance` (`pos472-performance.json`)
API/Node.js: requests/s, latencia p50/p95/p99, tasa de error 5xx, memoria, CPU y GC. Refresco: 10s. Fuente: Prometheus (`pos472_http_*`, `pos472_nodejs_*`).

### 3. `4-72 POS — Auditorías` (`audit-logs.json`)
Vista operativa general desde PostgreSQL (`eventos_auditoria`). Refresco: 30s. Total de eventos, errores, logins, usuarios activos, distribución por acción y tablas de detalle.

### 4. `4-72 POS — Ciberseguridad` (`pos472-ciberseguridad.json`) — nuevo
Detección de fuerza bruta (fallos de login en los últimos 5 min), IPs únicas, eliminaciones críticas en BD, top 10 IPs sospechosas, y **fugas de privilegios/escalación** (usuarios que intentaron ejecutar acciones restringidas a otro rol). Este último panel depende de que `RolesGuard` registre los intentos denegados — ver sección "Cambios de backend" abajo.

### 5. `4-72 POS — Feature Flags` (`pos472-feature-flags.json`)
Basado 100% en SQL sobre `feature_flags` (`activofeature_flags`, `entornofeature_flags`). No hay modo A/B test en el modelo real ni métrica Prometheus de feature flags — se descartó ese enfoque.

### 6. `4-72 POS — DevSecOps (Placeholder)` (`pos472-devsecops.json`) — nuevo, sin datos aún
Pipeline success rate, vulnerabilidades por severidad y lead time de parches. Muestra "No data" hasta conectar un exporter real de CI/CD o de un scanner SAST/DAST (no existe ese pipeline en el repo todavía).

---

## Cambios de backend necesarios para que los dashboards tengan datos

Al revisar por qué los dashboards no mostraban nada se encontraron dos bugs reales en `apps/server`, ya corregidos:

1. **`FeatureFlagsModule` nunca se registraba** en `app.module.ts` (estaba importado pero faltaba en el arreglo `imports`), así que toda la API de feature flags devolvía 404. Corregido.
2. **Los accesos denegados por rol no se auditaban.** `RolesGuard` devolvía `false` sin dejar rastro, así que el panel de "Fugas de privilegios" del dashboard de Ciberseguridad no tenía forma de mostrar datos. Ahora `RolesGuard` registra un evento `DENIED` vía `AuditService` (se hizo `AuditModule` `@Global()` para poder inyectarlo en los guards de cualquier módulo).

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
├── loki-config.yml                    ← config Loki (pendiente integrar, ver sección "Agregar Loki")
├── promtail-config.yml                ← recolector logs Docker (pendiente integrar)
└── prometheus.yml                     ← borrador con jobs adicionales (postgres/redis/rabbitmq exporters, no usados aún)

infra/                                 ← única fuente de verdad, montada por docker-compose.monitoring.yml
├── prometheus/prometheus.yml
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   ├── prometheus.yml         ← uid: pos472_prom
    │   │   └── postgres.yml           ← uid: pos472_pg
    │   └── dashboards/default.yml
    └── dashboards/
        ├── server-metrics.json        ← CPU / RAM / disco / Heap (host, node_exporter)
        ├── pos472-performance.json    ← HTTP metrics + Node.js runtime (API)
        ├── audit-logs.json            ← Auditoría operativa general
        ├── pos472-ciberseguridad.json ← Fuerza bruta, IPs sospechosas, escalación de privilegios
        ├── pos472-feature-flags.json  ← Estado de feature flags (activo/entorno)
        └── pos472-devsecops.json      ← Placeholder, pendiente de exporters CI/CD y SAST/DAST
```

Cualquier archivo `.json` nuevo que agregues en `infra/grafana/dashboards/` aparece automáticamente en Grafana en ≤30s, sin reiniciar el contenedor.

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
