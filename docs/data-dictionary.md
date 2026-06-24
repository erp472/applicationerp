# Modelo de Datos — Sistema POS 4-72

## Jerarquía de tablas

```
comercios
└── regionales
    └── sucursales
        ├── equipos_autorizados  (MAC security)
        ├── usuarios
        ├── cajas (menor | general | pos)
        │   └── sesiones_caja
        │       └── movimientos_caja
        ├── inventario_sucursal → productos
        ├── servicios_sucursal  → servicios
        └── convenios_sucursal  → convenios_recaudo
```

## Tablas por migración

### 001_base_schema.sql

| Tabla | PK | FKs clave | Notas |
|-------|-----|-----------|-------|
| `comercios` | UUID | — | NIT único, código único ("4-72") |
| `regionales` | UUID | comercio_id | Ej: "Regional Bogotá" |
| `sucursales` | UUID | regional_id | Código CIPOS, tipo: unipersonal/multipuesto |
| `equipos_autorizados` | UUID | sucursal_id | MAC address única por equipo |
| `usuarios` | UUID | sucursal_id | 7 roles jerárquicos |
| `cajas` | UUID | sucursal_id | tipo: menor/general/pos |
| `sesiones_caja` | UUID | caja_id, usuario_id | Apertura-cierre diario |
| `movimientos_caja` | UUID | sesion_caja_id | 16 tipos de movimiento |
| `consignaciones` | UUID | sesion_caja_id, usuario_id | Flujo: pendiente→aprobada |
| `reposiciones_caja` | UUID | sesion_origen_id, sesion_destino_id | Entre cajas |
| `tipos_cliente` | UUID | — | retail, TPR, aliado, expendio, sisbén |
| `clientes` | UUID | tipo_cliente_id | Índice trgm para búsqueda por nombre |
| `eventos_auditoria` | UUID | usuario_id, sucursal_id | Audit trail completo |

### 002_inventario.sql

| Tabla | PK | FKs clave | Notas |
|-------|-----|-----------|-------|
| `productos` | UUID | — | tipos: estampilla, filatelia, empaque, alistamiento |
| `inventario_sucursal` | UUID | sucursal_id, producto_id | Stock INFORMATIVO (no bloquea ventas) |
| `movimientos_inventario` | UUID | sucursal_id, producto_id | entrada/salida/ajuste/devolucion |
| `ordenes_inventario` | UUID | sucursal_id | Pedido al almacén central |
| `ordenes_inventario_items` | UUID | orden_id, producto_id | Ítem por ítem |

### 003_envios.sql

| Tabla | PK | FKs clave | Notas |
|-------|-----|-----------|-------|
| `servicios` | UUID | — | código Sigma para registro externo |
| `servicios_sucursal` | composite | sucursal_id, servicio_id | Habilitar/deshabilitar por punto |
| `tarifas_servicio` | UUID | servicio_id, tipo_cliente_id | Rangos de peso + tipo cliente |
| `envios` | UUID | muchas | número_guia único, peso_tarificado = MAX(físico, volumétrico) |

**Fórmula peso volumétrico:**
```
peso_vol_kg = (alto_cm × ancho_cm × largo_cm) / factor_volumetrico
peso_tarificado_kg = MAX(peso_fisico_kg, peso_vol_kg)
```
Factor por defecto: **2500** (configurable por servicio).

### 004_giros.sql

| Tabla | PK | FKs clave | Notas |
|-------|-----|-----------|-------|
| `giros` | UUID | sucursal_id, sesion_caja_id | tipos: nacional/moneygram/ria/ifs |
| `convenios_recaudo` | UUID | — | APIs: rest/barcode/sftp |
| `convenios_sucursal` | composite | sucursal_id, convenio_id | |
| `recaudos` | UUID | convenio_id, sucursal_id | |
| `listas_restrictivas` | UUID | — | Caché local SAGRILAFT/OFAC/PEP |
| `consultas_inspektor` | UUID | giro_id | Historial de consultas |

### 005_despacho_apartados_facturacion.sql

| Tabla | PK | FKs clave | Notas |
|-------|-----|-----------|-------|
| `sacas` | UUID | sucursal_id, usuario_id | Agrupa envíos para despacho |
| `envios_saca` | UUID | saca_id, envio_id | Muchos-a-uno |
| `apartados_postales` | UUID | sucursal_id, cliente_id | Alerta 30 días antes de vencer |
| `facturas` | UUID | referencia_id, sesion_caja_id | recibo_venta o electronica (DIAN) |
| `facturas_items` | UUID | factura_id | Ítems de la factura |
| `alertas` | UUID | sucursal_id, referencia_id | 12 tipos de alerta |
| `anulaciones` | UUID | referencia_id | requieren aprobación supervisor |

### 006_views_kpis.sql (vistas, no tablas)

| Vista | Usa tablas | KPI |
|-------|-----------|-----|
| `v_kpi_caja_estado` | sesiones_caja, movimientos_caja | Saldo estimado cajas abiertas |
| `v_kpi_ventas_dia` | envios, servicios | Ventas del día por cajero |
| `v_kpi_giros_dia` | giros | Dashboard giros por tipo |
| `v_kpi_diferencias_mes` | movimientos_caja | Faltantes/sobrantes históricos |
| `v_kpi_inventario_critico` | inventario_sucursal | Stock bajo mínimo |
| `v_kpi_apartados_vencer` | apartados_postales | Próximos a vencer (30d) |
| `v_kpi_ranking_sucursales` | envios + giros + recaudos | Top 65 por ingreso total |
| `v_kpi_anulaciones` | envios + anulaciones | Tasa anulación por cajero |

## Índices críticos

```sql
-- Búsqueda de clientes por nombre (full text fuzzy)
CREATE INDEX idx_clientes_nombre ON clientes USING gin(
  (nombre || ' ' || COALESCE(apellido,'')) gin_trgm_ops
);

-- Búsqueda por documento
CREATE INDEX idx_clientes_doc ON clientes(tipo_documento, numero_documento);

-- Listas restrictivas
CREATE INDEX idx_listas_doc ON listas_restrictivas(tipo_documento, numero_documento);

-- Envíos: queries de KPI y despacho
CREATE INDEX idx_envios_sucursal_fecha ON envios(sucursal_id, created_at);
CREATE INDEX idx_envios_guia ON envios(numero_guia);

-- Giros: queries de KPI
CREATE INDEX idx_giros_sucursal_fecha ON giros(sucursal_id, created_at);

-- Sesiones activas
CREATE INDEX idx_sesiones_caja_estado ON sesiones_caja(caja_id, estado);

-- Alertas pendientes
CREATE INDEX idx_alertas_sucursal_estado ON alertas(sucursal_id, estado);
```

## Convenciones

- **PK**: UUID (`gen_random_uuid()` via pgcrypto)
- **Timestamps**: `TIMESTAMPTZ` (siempre con zona horaria)
- **Moneda**: `NUMERIC(18,2)` — pesos colombianos (COP)
- **Pesos**: `NUMERIC(8,3)` — kilogramos con 3 decimales
- **Dimensiones**: `NUMERIC(8,2)` — centímetros
- **Soft delete**: columna `activo BOOLEAN DEFAULT true`
- **Auditoría**: tabla `eventos_auditoria` cubre INSERT/UPDATE/DELETE en todas las tablas críticas
