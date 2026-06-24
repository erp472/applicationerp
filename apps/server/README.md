# Sistema POS 4-72 — API

Backend del sistema de reemplazo para la Red Postal de Colombia (4-72).
NestJS 11 · Fastify · PostgreSQL 16 · Prisma 7 · OpenTelemetry

---

## Requisitos

- Node.js 22+
- Docker y Docker Compose
- PostgreSQL 16 corriendo localmente o vía Docker

---

## 1. Variables de entorno

```bash
cp apps/server/.env.example apps/server/.env   # si existe
# o edita directamente apps/server/.env
```

Variables mínimas:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/pos_472?schema=public"
JWT_SECRET="cambia_esto_en_produccion"
NODE_ENV="development"
```

---

## 2. Infraestructura (Docker)

Levanta Postgres, Redis, RabbitMQ, Prometheus, Grafana, Loki, Jaeger:

```bash
cd investigations
docker compose up -d
```

Apaga todo:

```bash
docker compose down
```

Apaga y borra volúmenes (reset completo):

```bash
docker compose down -v
```

---

## 3. Base de datos

```bash
cd apps/server

# Aplica migraciones y genera el cliente Prisma
npx prisma migrate dev
npx prisma generate
```

---

## 4. Servidor API

```bash
cd apps/server
npm install
npm run start:dev      # watch mode — recarga en cada cambio
```

La API queda disponible en:

| Recurso | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger / Docs | http://localhost:3000/api/docs |
| Métricas Prometheus | http://localhost:3000/metrics |

---

## 5. Observabilidad

### Prometheus

```
URL:  http://localhost:9090
```

Sin autenticación en local. Verifica que scrape la API:

`Status → Targets → pos472-api` debe aparecer como **UP**.

### Grafana

```
URL:      http://localhost:3001
Usuario:  admin
Password: grafana472
```

Los datasources y dashboards se aprovisionan automáticamente al iniciar el contenedor:

| Dashboard | Qué muestra |
|---|---|
| POS 4-72 — Performance | Latencia p50/p95/p99, req/s, memoria, CPU, GC |
| POS 4-72 — Auditoría | Eventos de auditoría, errores, tabla con link a Jaeger |

Si los dashboards no aparecen: **Dashboards → Browse → carpeta POS 4-72**.

### Jaeger (trazabilidad distribuida)

```
URL: http://localhost:16686
```

Sin autenticación. Busca por servicio `pos472-api`.

Desde la tabla de Auditoría en Grafana, cada `trace_id` tiene un link directo al trace en Jaeger.

### Loki (logs)

Accesible desde Grafana: **Explore → datasource Loki**.

Query de ejemplo para ver errores de la API:

```logql
{container_name="pos472_api"} | json | level = "error"
```

---

## 6. Tests

```bash
npm test              # corre una vez
npm run test:watch    # modo watch
npm run test:cov      # con cobertura
```

---

## 7. Estructura del proyecto

```
apps/server/
├── src/
│   ├── auth/           # JWT, Passport, login
│   ├── usuarios/       # CRUD usuarios (DDD — domain/application/infrastructure)
│   ├── audit/          # Auditoría enlazada con OTEL trace_id
│   ├── metrics/        # Prometheus (prom-client + HTTP interceptor)
│   ├── health/         # Health check (@nestjs/terminus)
│   ├── prisma/         # PrismaService (adapter-pg, ESM)
│   └── common/         # Guards (JWT, Roles) y decorators
├── prisma/
│   ├── schema.prisma   # Modelos: Usuario, Sucursal, EquipoAutorizado, Auditoria
│   └── migrations/     # Historial de migraciones SQL
├── generated/prisma/   # Cliente Prisma generado (no editar)
└── vitest.config.ts    # Configuración de tests
```

---

## 8. Puertos de referencia

| Servicio | Puerto |
|---|---|
| API NestJS | 3000 |
| Grafana | 3001 |
| Loki | 3100 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| RabbitMQ UI | 15672 |
| RabbitMQ AMQP | 5672 |
| Prometheus | 9090 |
| Jaeger UI | 16686 |
| Jaeger OTLP HTTP | 4318 |
