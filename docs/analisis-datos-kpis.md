# Análisis de Datos y KPIs — Sistema POS 4-72

> Extraído de las sesiones de levantamiento de información (FASE_1 y FASE_2) y del documento oficial de desarrollo.
> Este documento describe qué mide el negocio, qué necesita medir, y cómo cada KPI se traduce a una vista SQL o endpoint de la API.

---

## 1. Contexto Operativo

### 1.1 Puntos de venta
| Dimensión | Valor actual |
|-----------|-------------|
| Puntos de venta activos | ~65 (mayormente unipersonales) |
| Puntos multipuesto | Minoría (hasta 3 asesores por turno) |
| Horario típico | 08:00 – 18:00 |
| Despacho de transporte | 17:30 (todo lo que no salió queda pendiente) |
| Cierre de sistema | 22:00 (automático) |
| Tipos de caja por punto | Caja Menor + Caja General + 1–N Cajas POS |

### 1.2 Líneas de negocio
```
┌─────────────────────────────────────────────────────────────┐
│  SERVICIOS POSTALES        │  SERVICIOS FINANCIEROS          │
│  ─────────────────         │  ──────────────────             │
│  • Correspondencia (SPU)   │  • Giros nacionales             │
│  • Paquetes nacionales      │  • MoneyGram (mundial)          │
│  • Correo certificado       │  • RIA (solo pago, 11 dígitos)  │
│  • Internacional MS/UPU    │  • IFS (6 países, web propia)   │
│  • International Courier    │  • Giros CFS (FortiClient/VPN)  │
│    (HES / ANICA)            │  • Recaudos por convenio        │
│  • Apartados postales       │  • Corresponsal bancario*       │
│  • Venta estampillas        │                                 │
│  • Filatelia / empaque      │  * en reactivación              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Catálogo de KPIs

### 2.1 KPIs de Caja (#POC-KPI-001, #POC-KPI-004)

#### KPI-C01: Saldo estimado por caja (tiempo real)
**Descripción:** Cuánto efectivo tiene cada caja abierta en este momento.  
**Fórmula:**
```
Saldo = Monto_apertura
      + SUM(ingresos: venta_producto, venta_servicio, venta_estampilla, giro_pago, recaudo, apartado_postal)
      - SUM(egresos: giro_emision_cobro, consignacion, cambio_custodia_out)
      + SUM(ajustes_positivos: cambio_custodia_in, diferencia_sobrante)
      - SUM(ajustes_negativos: diferencia_faltante)
```
**Vista SQL:** `v_kpi_caja_estado`  
**Endpoint:** `GET /v1/kpis/cajas/estado`  
**Frecuencia:** En tiempo real (por evento)  
**Audiencia:** Cajero (su caja), Administrativo (todas las cajas del punto), Supervisor (todas las sucursales)

---

#### KPI-C02: Diferencias faltante/sobrante
**Descripción:** Monitoreo de descuadres de caja. Un faltante sostenido puede indicar fraude, error en cambio, o robo. Un sobrante frecuente indica errores de cobro.  
**Fórmula:**
```
Tasa_faltante = SUM(diferencias_faltante) / SUM(total_ventas) × 100
```
**Origen del problema (transcripción):** CIPOS maneja decimales en las tarifas, MultiPay redondea → diferencia de pesos → se debe registrar como "moneda circulante" (faltante o sobrante) aprobada por Tesorería.  
**Vista SQL:** `v_kpi_diferencias_mes`  
**Endpoint:** `GET /v1/kpis/diferencias?desde=&hasta=&sucursal=`  
**Dimensiones de análisis:**
- Por sucursal
- Por cajero
- Por mes
- Por causa (moneda_circulante vs diferencia_real)

---

#### KPI-C03: Consignaciones pendientes de aprobación
**Descripción:** Consignaciones bancarias registradas por el cajero que aún no han sido validadas por Tesorería. Su aprobación disminuye el saldo de la caja.  
**Regla de negocio:** Cuando el saldo supera el límite_alerta, el cajero debe hacer una consignación. Sin aprobación de Tesorería, el saldo no disminuye en sistema.  
**Alerta:** Si una consignación lleva >24h pendiente → alerta automática.  
**Endpoint:** `GET /v1/alertas?tipo=consignacion_pendiente`

---

#### KPI-C04: Apertura y cierre de caja — Estadísticas
**Descripción:** Control de que todos los puntos abrieron y cerraron correctamente.  
**Regla de negocio crítica:** A las 22:00 el sistema cierra forzosamente todas las sesiones abiertas (`cierre_forzado = true`). Esto puede coincidir con operación activa → requiere política clara.  
**Métricas:**
- Puntos que NO abrieron caja hoy
- Puntos con cierre forzado (pasaron las 22:00 con caja abierta)
- Tiempo promedio entre apertura y primer movimiento
- Tiempo promedio entre último movimiento y cierre

---

### 2.2 KPIs de Ventas y Servicios Postales (#POC-KPI-002)

#### KPI-V01: Ventas del día por sucursal / cajero / servicio
**Descripción:** Ingresos generados por envíos en el día corriente.  
**Dimensiones:**
```
ventas_dia = {
  sucursal,
  cajero,
  tipo_servicio: [nacional, internacional_ms, internacional_courier],
  cantidad_guias,
  valor_total_cop,
  ticket_promedio,
  peso_total_kg
}
```
**Vista SQL:** `v_kpi_ventas_dia`  
**Endpoint:** `GET /v1/kpis/ventas/dia`

---

#### KPI-V02: Tiempo de atención por tipo de servicio
**Descripción:** KPI de eficiencia operativa. Detectado en transcripción: el proceso actual tarda hasta **55 minutos** para un envío internacional (doble registro en sistema propio + HES/ANICA). El nuevo sistema debe reducir esto drásticamente.  
**Benchmark actual (sistema legado):**

| Tipo de servicio | Tiempo actual | Meta nuevo sistema |
|-----------------|--------------|-------------------|
| Correspondencia nacional | ~5 min | ≤2 min |
| Paquete nacional | ~10 min | ≤4 min |
| Internacional MS | ~30 min | ≤8 min |
| Internacional Courier (HES) | ~55 min | ≤12 min |
| Giro nacional | ~5 min | ≤3 min |
| Giro MoneyGram | ~8 min | ≤4 min |
| Giro RIA | ~3 min | ≤2 min |

**Cómo medir:** `timestamp(primer_movimiento_caja) - timestamp(apertura_guia)` — requiere campo `inicio_atencion` en tabla `envios`.  
**Endpoint:** `GET /v1/kpis/ventas/tiempos-atencion?desde=&hasta=`

---

#### KPI-V03: Servicios más y menos vendidos
**Descripción:** Top y bottom de servicios por frecuencia y por ingreso.  
**Uso:** Decisiones de portafolio — si un servicio no se vende, puede desactivarse por parametrización para no saturar la lista del cajero.  
**SQL:**
```sql
SELECT servicio_id, sv.nombre, sv.tipo,
       COUNT(*) AS guias_emitidas,
       SUM(valor_total) AS ingreso_total,
       AVG(valor_total) AS ticket_promedio
FROM envios e JOIN servicios sv ON sv.id = e.servicio_id
WHERE e.created_at >= NOW() - INTERVAL '30 days' AND e.estado != 'anulado'
GROUP BY servicio_id, sv.nombre, sv.tipo
ORDER BY guias_emitidas DESC;
```
**Endpoint:** `GET /v1/kpis/ventas/servicios-ranking?desde=&hasta=`

---

#### KPI-V04: Estampillas — control de uso y stock
**Descripción:** Las estampillas son a la vez un producto vendible Y un medio de pago (preporteado). El sistema debe controlar:
- Cuántas estampillas se vendieron (tipo salida por venta)
- Cuántas se usaron como medio de pago (preporteado / mixto preporteado)
- Cuántas quedan en inventario físico

**Problema detectado (transcripción):** Actualmente el cajero no ve el stock disponible al momento de vender. Tiene que ir al módulo de reportes para saberlo. **El nuevo sistema debe mostrar el stock en tiempo real en la pantalla de venta.**

**Alerta automática:** Si `cantidad_actual < cantidad_minima` → alerta a administrativo y almacén.

---

### 2.3 KPIs de Giros (#POC-KPI-003)

#### KPI-G01: Giros del día por tipo y operación
**Descripción:** Dashboard operativo de los servicios financieros más sensibles (manejo de efectivo, cumplimiento regulatorio).  
**Dimensiones:**
```
giros_dia = {
  tipo: [nacional, moneygram, ria, ifs, cfs],
  operacion: [emision, pago],
  total_transacciones,
  monto_base_cop,
  comision_total_cop (flete),
  exitosos,
  rechazados,
  bloqueados_inspektor,
  tiempo_promedio_atencion_min
}
```

**Capacidades por tipo (confirmado en transcripción FASE 2):**
| Tipo | Emite | Paga | Listas restrictivas | Caja en tiempo real |
|------|-------|------|-------------------|-------------------|
| Nacional | ✅ | ✅ | Auto (Inspektor) | ✅ |
| MoneyGram | ✅ | ✅ | Auto (propias MG) | ✅ |
| RIA | ❌ | ✅ | Auto (Inspektor) | ✅ |
| IFS | ✅ | ✅ | Manual (Fiat-Tandra) | ✅ |
| CFS | ✅ | ✅ | No integrado | ⚠️ cada hora |

**Nota CFS:** Las transacciones CFS se registran en la plataforma CFS externa (FortiClient/VPN) y el impacto en caja se sincroniza cada hora, no en tiempo real. Esta es una brecha crítica a resolver en el nuevo sistema.

**Vista SQL:** `v_kpi_giros_dia`  
**Endpoint:** `GET /v1/kpis/giros/dia`

---

#### KPI-G02: Alertas de cumplimiento (Inspektor / SAGRILAFT / LAFT)
**Descripción:** Porcentaje de giros que generaron alerta en listas restrictivas. Un porcentaje alto puede indicar un perfil de clientes de riesgo en una sucursal.

**Estado actual por tipo de giro (confirmado en transcripción FASE 2):**

| Tipo giro | Lista consultada | Modo | Problema |
|-----------|----------------|------|---------|
| Nacional | Inspektor (SAGRILAFT + listas internas 4-72) | Automático | ✅ |
| MoneyGram | Listas propias MoneyGram | Automático (en su API) | ✅ |
| RIA | Inspektor | Automático | ✅ |
| IFS | Fiat-Tandra (lista externa) | **Manual** (usuario/clave separados) | ⚠️ debe integrarse |
| CFS | Ninguna | **No integrado** | 🔴 brecha crítica |

**Comportamiento ante alerta:** No bloquea automáticamente la transacción — el cajero debe validar la situación con el cliente. El sistema registra el resultado en `giros.resultado_inspektor` para auditoría.

**Tipos de lista (internas 4-72):**

| Lista | Descripción | Integración |
|-------|-------------|-------------|
| SAGRILAFT | Lavado de activos (Colombia) | Automática (Inspektor) |
| Terrorismo | Listas de terrorismo | Automática (Inspektor) |
| OFAC | Terrorismo internacional (EE.UU.) | Automática (MoneyGram) |
| PEP | Personas Políticamente Expuestas | Automática (Inspektor) |
| Interna 4-72 | Lista propia de bloqueados históricos | Automática |
| Fiat-Tandra | Listas de IFS | **Manual actualmente** |
| CFS (sin nombre) | Listas de CFS | **No integrado** |

**Endpoint:** `GET /v1/kpis/cumplimiento/alertas?desde=&hasta=&sucursal=`

---

#### KPI-G03: Volumen de giros por proveedor y país destino
**Descripción:** Análisis de la distribución de giros por operador para negociación de tarifas y evaluación de cobertura.  
**SQL:**
```sql
SELECT tipo, beneficiario_pais, moneda_destino,
       COUNT(*) AS total,
       SUM(monto_cop) AS monto_cop,
       SUM(flete_cop) AS comision_cop,
       AVG(monto_cop) AS ticket_promedio
FROM giros
WHERE operacion = 'emision'
  AND estado IN ('aprobado','pagado')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY tipo, beneficiario_pais, moneda_destino
ORDER BY total DESC;
```

---

#### KPI-G04: Giros con documentos de cumplimiento incompletos
**Descripción:** Transacciones que no tienen formulario 5, declaración de origen o fotocopia de cédula. Riesgo regulatorio MinTIC/SAGRILAFT.  
**SQL:**
```sql
SELECT COUNT(*) AS giros_con_documentos_incompletos,
       SUM(monto_total_cop) AS monto_expuesto
FROM giros
WHERE estado = 'aprobado'
  AND (formulario_5 = false OR declaracion_origen = false OR fotocopia_cedula = false)
  AND created_at::date = CURRENT_DATE;
```
**Endpoint:** `GET /v1/kpis/cumplimiento/documentos-pendientes`

---

### 2.4 KPIs de Inventario (#POC-KPI-005)

#### KPI-I01: Inventario crítico (bajo mínimo)
**Descripción:** Productos cuyo stock actual cayó por debajo del mínimo definido. En 4-72 el inventario es principalmente estampillas (las cuales son dinero físico) y material de empaque.

**Criticidad especial de las estampillas:** Son un valor monetario. Si se extravían, es una pérdida económica directa para el punto de venta. Requieren arqueo físico periódico.

**Vista SQL:** `v_kpi_inventario_critico`  
**Endpoint:** `GET /v1/kpis/inventario/critico`

**Niveles de alerta:**
| Nivel | Condición | Acción |
|-------|-----------|--------|
| 🟡 Advertencia | `cantidad_actual < cantidad_minima * 1.5` | Notificación a almacén |
| 🔴 Crítico | `cantidad_actual < cantidad_minima` | Alerta urgente + bloqueo de despacho si es 0 |
| ⚫ Sin stock | `cantidad_actual = 0` | Alerta crítica + registro en `alertas` |

---

#### KPI-I02: Rotación de inventario
**Descripción:** Velocidad con que se consume cada producto. Útil para proyectar pedidos a almacén.  
**Fórmula:**
```
dias_cobertura = cantidad_actual / (salidas_ultimos_30_dias / 30)
```
**SQL:**
```sql
SELECT p.nombre, p.tipo,
       inv.cantidad_actual,
       COALESCE(mov.salidas_30d, 0) AS salidas_30d,
       CASE WHEN COALESCE(mov.salidas_30d, 0) = 0 THEN NULL
            ELSE ROUND(inv.cantidad_actual / (mov.salidas_30d::numeric / 30), 1)
       END AS dias_cobertura
FROM inventario_sucursal inv
JOIN productos p ON p.id = inv.producto_id
LEFT JOIN (
  SELECT producto_id, SUM(cantidad) AS salidas_30d
  FROM movimientos_inventario
  WHERE tipo = 'salida' AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY producto_id
) mov ON mov.producto_id = inv.producto_id
WHERE inv.sucursal_id = $1
ORDER BY dias_cobertura ASC NULLS LAST;
```
**Endpoint:** `GET /v1/kpis/inventario/rotacion/:sucursalId`

---

### 2.5 KPIs de Apartados Postales (#POC-KPI-006)

#### KPI-AP01: Apartados próximos a vencer (30 días)
**Descripción:** Listado de apartados cuya vigencia vence en los próximos 30 días para gestión proactiva de renovación.

**Problema detectado (transcripción):** Actualmente NO hay alerta automática al cliente ni al asesor. La gestión es completamente manual.

**Solución en el nuevo sistema:**
1. Cron diario a las 08:00 → genera alerta en sistema para cada apartado que vence en ≤30 días
2. Email automático al cliente con enlace de renovación
3. SMS o WhatsApp (fase posterior)

**Vista SQL:** `v_kpi_apartados_vencer`  
**Endpoint:** `GET /v1/kpis/apartados/por-vencer`  
**Cron:** `0 8 * * *` (cada día a las 8AM)

---

#### KPI-AP02: Tasa de renovación de apartados
**Descripción:** Qué porcentaje de los apartados que vencen se renuevan vs se pierden.  
**SQL:**
```sql
SELECT
  DATE_TRUNC('month', ap.fecha_fin) AS mes_vencimiento,
  COUNT(*) AS total_vencidos,
  COUNT(CASE WHEN ap.estado = 'ocupado' AND ap.fecha_fin > ap.fecha_inicio + INTERVAL '1 year' THEN 1 END) AS renovados,
  ROUND(COUNT(CASE WHEN ap.estado = 'ocupado' AND ap.fecha_fin > ap.fecha_inicio + INTERVAL '1 year' THEN 1 END) * 100.0 / COUNT(*), 2) AS tasa_renovacion_pct
FROM apartados_postales ap
WHERE ap.fecha_fin BETWEEN NOW() - INTERVAL '12 months' AND NOW()
GROUP BY mes_vencimiento
ORDER BY mes_vencimiento DESC;
```

---

### 2.6 KPIs de Despacho (#POC-DESP-001 ~ 003)

#### KPI-D01: Sacas creadas y estado al cierre del día
**Descripción:** Control de cuántos envíos salieron vs cuántos quedaron pendientes.

**Regla de negocio crítica:** Todo envío facturado ese día debería estar en una saca antes de las 17:30. Si no sale, incumple el SLA de tránsito.

**Problema detectado (transcripción):** Si un sobre no se incluyó en la saca antes de que el transporte recoja, hay que informar manualmente por correo a novedades. El nuevo sistema debe gestionar esto con alertas automáticas.

**SQL:**
```sql
SELECT
  s.nombre AS sucursal,
  sc.tipo,
  sc.estado,
  sc.total_envios,
  sc.peso_kg,
  sc.fecha_despacho,
  -- Envíos facturados hoy que NO están en ninguna saca
  (SELECT COUNT(*) FROM envios e
   WHERE e.sucursal_id = sc.sucursal_id
   AND e.created_at::date = CURRENT_DATE
   AND e.estado = 'facturado'
   AND NOT EXISTS (SELECT 1 FROM envios_saca es WHERE es.envio_id = e.id)
  ) AS envios_sin_despachar
FROM sacas sc
JOIN sucursales s ON s.id = sc.sucursal_id
WHERE sc.created_at::date = CURRENT_DATE;
```
**Endpoint:** `GET /v1/kpis/despacho/estado-dia`

---

#### KPI-D02: Envíos sin despachar al cierre
**Descripción:** Alerta crítica — envíos facturados que no se incluyeron en ninguna saca al momento del cierre (22:00).  
**Alerta automática:** Cron a las 17:00 y 21:00 → si hay envíos con `estado = 'facturado'` sin saca → alerta urgente al supervisor.

---

### 2.7 KPIs de Anulaciones (#POC-KPI-008)

#### KPI-AN01: Tasa de anulaciones por cajero y sucursal
**Descripción:** Porcentaje de guías facturadas que fueron luego anuladas (aprobadas por supervisor). Una tasa alta puede indicar errores frecuentes, confusión en servicios, o fraude.

**Proceso de anulación (transcripción):** Las anulaciones requieren aprobación del módulo de Tesorería/Administrativo. Generan una alerta que el supervisor debe aprobar o rechazar.

**Vista SQL:** `v_kpi_anulaciones`  
**Endpoint:** `GET /v1/kpis/anulaciones?desde=&hasta=`

**Umbrales de alerta:**
| Tasa | Semáforo | Acción |
|------|----------|--------|
| < 2% | 🟢 Normal | Solo monitoreo |
| 2–5% | 🟡 Atención | Revisión mensual |
| > 5% | 🔴 Crítico | Auditoría inmediata |

---

### 2.8 KPI de Ranking Nacional (#POC-KPI-007)

#### KPI-R01: Ranking de desempeño entre las 65 sucursales
**Descripción:** Vista consolidada del ingreso total generado por cada punto de venta en el día. Permite a la Dirección Nacional identificar sucursales de alto y bajo rendimiento.

**Componentes del ingreso total:**
```
Ingreso_total = ingresos_envios
              + comisiones_giros (flete cobrado)
              + monto_recaudos
              + ventas_productos (estampillas, filatelia, empaque)
```

**Vista SQL:** `v_kpi_ranking_sucursales`  
**Endpoint:** `GET /v1/kpis/ranking/sucursales?fecha=`

**Filtros disponibles:**
- Por fecha (default: hoy)
- Por regional
- Por tipo de punto (unipersonal / multipuesto)
- Rango de fechas (semana, mes, quincena)

---

### 2.9 KPIs de Clientes (#POC-CLI-001, #POC-CLI-002)

#### KPI-CL01: Base de datos de clientes — calidad del dato
**Descripción:** Control de la calidad de los registros de clientes. Problema detectado en transcripción: asesores ingresaban documentos como "1, 2, 3", correos inválidos, etc.

**Métricas de calidad:**
```sql
SELECT
  COUNT(*) AS total_clientes,
  COUNT(CASE WHEN LENGTH(numero_documento) < 7 THEN 1 END) AS doc_cortos_sospechosos,
  COUNT(CASE WHEN email IS NULL OR email NOT LIKE '%@%.%' THEN 1 END) AS sin_email_valido,
  COUNT(CASE WHEN telefono IS NULL THEN 1 END) AS sin_telefono,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS clientes_nuevos_mes
FROM clientes WHERE activo = true;
```

---

#### KPI-CL02: Clientes Sisbén — control de cupo anual
**Descripción:** Los clientes con beneficio Sisbén tienen un cupo máximo de **7 envíos por año** con descuento. El sistema debe controlar este cupo en tiempo real.

**Regla:**
```
Si cliente.nivel_sisben IS NOT NULL
  Y cliente.envios_sisben_ano >= 7
    → No aplicar descuento (facturar como retail)
    → Mostrar alerta en POS: "Cliente alcanzó cupo Sisbén anual"
```

**Reset:** El contador `envios_sisben_ano` se resetea el 1 de enero de cada año (cron).

**SQL de monitoreo:**
```sql
SELECT
  c.tipo_documento, c.numero_documento, c.nombre, c.apellido,
  c.nivel_sisben, c.envios_sisben_ano,
  (7 - c.envios_sisben_ano) AS cupo_restante
FROM clientes c
WHERE c.nivel_sisben IS NOT NULL
  AND c.envios_sisben_ano > 0
ORDER BY c.envios_sisben_ano DESC;
```

---

#### KPI-CL03: Tipos de cliente — distribución y descuentos aplicados
**Descripción:** Análisis de qué porcentaje de las ventas va a cada tipo de cliente y cuánto descuento se está otorgando.

**Tipos identificados en transcripción:**
| Código | Nombre | Descuento | Especial |
|--------|--------|-----------|---------|
| `retail` | Cliente general | 0% | Asignado por defecto a clientes nuevos |
| `tarifa_postal_reducida` | TPR | 20% | Usa estampillas como medio de pago |
| `aliado` | Aliado comercial | 15% | Multimarca, comparan con otros sistemas |
| `expendio` | Expendio autorizado | 10% | Descuento configurable |
| `sisben_1` a `sisben_4` | Beneficio social | 20–50% | Máx 7 envíos/año |

---

### 2.10 KPIs de Recaudos (#POC-KPI-003 parcial)

#### KPI-REC01: Recaudos por convenio
**Descripción:** Total de recaudos procesados por cada convenio (EPM, ETB, Codensa, Claro, etc.) en el día.

**Parámetro clave (transcripción):** No todos los puntos de venta pueden recibir todos los recaudos. La habilitación es parametrizable por sucursal.

**SQL:**
```sql
SELECT
  conv.nombre AS convenio,
  s.nombre AS sucursal,
  COUNT(*) AS total_operaciones,
  SUM(r.monto) AS monto_total,
  COUNT(CASE WHEN r.estado = 'exitoso' THEN 1 END) AS exitosos,
  COUNT(CASE WHEN r.estado = 'fallido' THEN 1 END) AS fallidos
FROM recaudos r
JOIN convenios_recaudo conv ON conv.id = r.convenio_id
JOIN sucursales s ON s.id = r.sucursal_id
WHERE r.created_at::date = CURRENT_DATE
GROUP BY conv.nombre, s.nombre
ORDER BY monto_total DESC;
```
**Endpoint:** `GET /v1/kpis/recaudos/dia`

---

## 3. Problemas de Negocio Detectados y su Impacto en Datos

Esta sección mapea los pain points identificados en las transcripciones contra los módulos y métricas del nuevo sistema.

### 3.1 Doble registro de información
**Problema (transcripción FASE 1):** Para envíos internacionales Courier, el cajero debe ingresar los mismos datos dos veces: una en CIPOS/MultiPay y otra en la plataforma del proveedor (HES, ANICA). Esto tarda hasta **55 minutos** por transacción.

**Impacto en datos:**
- Inconsistencias entre registros en sistemas distintos
- Pérdida de trazabilidad
- Tiempo no productivo del cajero

**Solución en nuevo sistema:**
- Un solo ingreso de datos → el sistema hace el POST al proveedor vía API (Sigma, HES/ANICA)
- Guardar `referencia_proveedor` y `referencia_sigma` en tabla `envios`
- Campo `documentos_generados JSONB` para almacenar los PDFs generados

**KPI asociado:** Tiempo promedio de atención (KPI-V02)

---

### 3.2 Stock de inventario invisible en tiempo real
**Problema (transcripción FASE 1):** El cajero no ve cuántas estampillas tiene disponibles al momento de vender. Debe ir al módulo de reportes y descargar un informe. Esto genera pérdida de tiempo y ventas fallidas.

**Impacto en datos:**
- Ventas que se inician y no pueden completarse (no hay manera de medir esto actualmente)
- Descuadres de inventario por no aceptar correctamente las órdenes de almacén

**Solución en nuevo sistema:**
- `GET /v1/inventario/sucursal/:id` devuelve stock en tiempo real visible en el POS
- Al seleccionar un producto en la venta, mostrar cantidad disponible
- El inventario NO bloquea la venta (solo es informativo, per doc oficial) pero SÍ muestra alerta visual

**KPI asociado:** KPI-I01, KPI-I02

---

### 3.3 Alertas de vencimiento de apartados: proceso 100% manual
**Problema (transcripción FASE 1):** No hay notificación automática al cliente ni al punto de venta cuando un apartado postal está próximo a vencer. La gestión es completamente manual y ad-hoc.

**Impacto en datos:**
- Pérdida de ingresos por renovaciones no realizadas
- Sin trazabilidad de contactos al cliente

**Solución en nuevo sistema:**
- Cron diario 8AM → detecta apartados con `fecha_fin` en ≤30 días → inserta en `alertas` → envía email al cliente
- Dashboard con `v_kpi_apartados_vencer`
- Métricas de tasa de renovación (KPI-AP02)

---

### 3.4 Lista de servicios sin filtro → errores y lentitud
**Problema (transcripción FASE 1):** La lista de servicios disponibles no tiene filtro de búsqueda. El cajero debe desplazarse manualmente por una lista larga con nombres similares. Genera errores de selección y tiempos de atención altos.

**Impacto en datos:**
- Guías facturadas con servicio incorrecto → generan anulaciones (↑ tasa anulaciones)
- Tiempos de atención elevados (↑ KPI-V02)

**Solución en nuevo sistema:**
- El POS filtra servicios por país destino, tipo de pieza y tipo de cliente al momento de seleccionar
- Solo muestra servicios habilitados para esa sucursal (`servicios_sucursal`)
- Búsqueda por texto con debounce

---

### 3.5 Datos del cliente no sincronizados entre módulos
**Problema (transcripción FASE 1):** Si el cajero ingresa el correo del cliente en el módulo de clientes, ese correo NO aparece automáticamente en la pantalla de facturación. Hay que ingresarlo dos veces.

**Impacto en datos:**
- Correos incorrectos en facturas electrónicas DIAN
- Experiencia degradada del cliente

**Solución en nuevo sistema:**
- Un único registro `clientes` referenciado desde `envios`, `giros`, `recaudos` y `facturas`
- Al crear la guía y seleccionar el cliente por cédula, todos los campos se pre-rellenan

---

### 3.6 IFS: listas restrictivas manuales (brecha de cumplimiento)
**Problema (transcripción FASE 2):** Los giros IFS requieren que el cajero consulte manualmente la lista de Fiat-Tandra con credenciales separadas (usuario/contraseña distintos del sistema POS). No hay automatización ni registro en el sistema de POS del resultado de esa consulta.

**Impacto en datos:**
- Sin trazabilidad de la consulta de listas en el sistema (no queda en `consultas_inspektor`)
- Riesgo de que el cajero omita la consulta bajo presión de tiempo
- Sin métricas de cumplimiento para IFS (KPI-G02 incompleto)

**Solución en nuevo sistema:**
- Integrar Fiat-Tandra via API (si está disponible) o automatizar la consulta
- Registrar resultado en `consultas_inspektor` con `tipo_lista = 'fiat_tandra'`
- Exigir resultado antes de habilitar el botón de emitir/pagar en IFS

---

### 3.7 Giros CFS no integrados con caja (sincronización cada hora)
**Problema (transcripción FASE 2):** Los giros CFS se realizan en una plataforma completamente separada (FortiClient + VPN + interfaz web de CFS). El impacto en caja se refleja **solo cada hora** mediante sincronización periódica, no en tiempo real. CFS además **no tiene integración con listas restrictivas**.

**Impacto en datos:**
- El saldo de caja no es exacto durante el día para transacciones CFS
- Dificulta el cierre de caja preciso
- Sin trazabilidad de cumplimiento para este tipo de giro
- El cajero debe loguearse a dos sistemas para una sola operación (fricción operativa)

**Solución en nuevo sistema:**
- Integrar CFS directamente via API (pendiente confirmar disponibilidad)
- Cada transacción CFS genera inmediatamente su `movimiento_caja`
- Integrar con Inspektor o listas propias de CFS antes de aprobar
- Si no hay API: mantener sync horario pero mostrar advertencia de saldo aproximado en caja

---

### 3.8 Precintos de saca sin inventario digital
**Problema (transcripción FASE 2):** Los precintos (sellos de seguridad de las sacas) no se inventarían en el sistema. Se piden por un "formato de pedido de papelería" cuando se acaban.

**Impacto en datos:**
- Sin trazabilidad de precintos usados
- Posibilidad de apertura no autorizada de sacas sin detección

**Solución a futuro (fuera de alcance Q1):**
- Tabla `precintos` con número de serie único
- Al crear saca: asignar número de precinto con validación de que existe y está disponible
- Alerta cuando el stock de precintos disponibles baja del mínimo

---

## 4. Flujo de Datos por Operación

### 4.1 Flujo: Envío Nacional con Estampillas (SPU)

```
CAJERO
  │
  ├─ 1. Abre sesión de caja (sesiones_caja)
  ├─ 2. Busca cliente por cédula (clientes)
  ├─ 3. Selecciona servicio (servicios, tarifas_servicio)
  ├─ 4. Registra peso en báscula → peso_fisico_kg
  ├─ 5. Sistema calcula peso_tarificado = MAX(fisico, volumetrico)
  ├─ 6. Sistema cotiza: valor_servicio + valor_estampillas
  ├─ 7. Cajero selecciona medio de pago: mixto_preporteado
  │      ├─ Cobra dinero por el servicio
  │      └─ Cobra estampillas físicas y las aplica a la guía
  ├─ 8. Sistema crea envio (estado: 'facturado')
  ├─ 9. Sistema crea movimiento_caja (tipo: 'venta_servicio')
  ├─ 10. Sistema descuenta estampillas del inventario (movimientos_inventario)
  ├─ 11. Sistema crea factura (tipo: 'recibo_venta')
  ├─ 12. Sistema encola en RabbitMQ → DIAN (cola: 'dian.invoice.create')
  ├─ 13. Impresión de guía (EPSON TM-T88V)
  └─ 14. Al despacho: cajero incluye guía en saca (envios_saca)
```

### 4.2 Flujo: Giro Nacional (Emisión)

```
CAJERO
  │
  ├─ 1. Ingresa cédula del remitente
  ├─ 2. Sistema busca en clientes y listas_restrictivas (Inspektor)
  │      ├─ Si resultado = 'bloqueado' → RECHAZAR, crear alerta
  │      └─ Si resultado = 'limpio' → continuar
  ├─ 3. Captura huella dactilar del remitente
  ├─ 4. Ingresa datos del beneficiario + sucursal destino
  ├─ 5. Ingresa monto_cop + define si flete ($4.700) lo asume remitente o beneficiario
  ├─ 6. Sistema genera PIN único
  ├─ 7. Sistema crea giro (estado: 'aprobado')
  ├─ 8. Sistema crea movimiento_caja (tipo: 'giro_emision_cobro')
  ├─ 9. Cajero imprime formulario 5 + declaración origen fondos → cliente firma + huella
  └─ 10. Cajero registra formulario_5=true, declaracion_origen=true, fotocopia_cedula=true

SUCURSAL DESTINO (pago del giro)
  │
  ├─ 1. Cliente llega con PIN
  ├─ 2. Cajero consulta giro por PIN → valida identidad
  ├─ 3. Sistema actualiza giro (estado: 'pagado')
  └─ 4. Crea movimiento_caja (tipo: 'giro_pago')
```

### 4.3 Flujo: Despacho (Cierre de Saca)

```
CAJERO (15:00 - 17:30)
  │
  ├─ 1. Crea saca con número de precinto (sacas)
  ├─ 2. Escanea código de barras de cada guía → valida que esté facturada
  │      Sistema marca guía: estado → 'en_saca'
  ├─ 3. Coloca saca en báscula → registra peso_kg
  ├─ 4. Cierra saca → genera manifiesto de despacho
  └─ 5. Transporte llega, firma, se llevan la saca

SISTEMA (automático)
  ├─ 17:00 → Alerta si hay envíos del día sin despachar
  ├─ 21:50 → Alerta si hay envíos del día aún en estado 'facturado'
  └─ 22:00 → Cierre automático de sesiones de caja abiertas
```

---

## 5. Dashboard Ejecutivo — Vista Consolidada

### Panel 1: Estado Operativo (tiempo real, actualización ≤60s)
```
┌─────────────────────────────────────────────────────────┐
│  ESTADO OPERATIVO — HOY                                 │
│                                                         │
│  Puntos activos: 63/65   Puntos con alerta: 3          │
│  ──────────────────────────────────────────────────     │
│  Cajas abiertas: 87      Cajas con diferencia: 2       │
│  Consignaciones pendientes: 5                           │
│  ──────────────────────────────────────────────────     │
│  Envíos del día: 1,243   Valor: $48,750,000            │
│  Giros emitidos: 87      Comisiones: $408,900           │
│  Recaudos: 312           Monto: $15,600,000             │
│  ──────────────────────────────────────────────────     │
│  INGRESO TOTAL DÍA: $64,758,900                        │
│  ──────────────────────────────────────────────────     │
│  Alertas activas: 12     Anulaciones: 4                │
│  Giros bloqueados por lista: 1                          │
└─────────────────────────────────────────────────────────┘
```

### Panel 2: Top 5 Sucursales del Día (KPI-R01)
```
┌───┬──────────────────────┬──────────┬──────────┬───────────────┐
│ # │ Sucursal             │ Envíos   │ Giros    │ Ingreso Total │
├───┼──────────────────────┼──────────┼──────────┼───────────────┤
│ 1 │ Centro Bogotá 1001   │ $12.3M   │ $2.1M    │ $14.4M        │
│ 2 │ Chapinero 1002       │ $9.8M    │ $1.8M    │ $11.6M        │
│ 3 │ El Poblado 2003      │ $8.2M    │ $3.2M    │ $11.4M        │
│ 4 │ La Candelaria 1005   │ $7.1M    │ $2.9M    │ $10.0M        │
│ 5 │ Centro Cali 3001     │ $6.5M    │ $2.7M    │ $9.2M         │
└───┴──────────────────────┴──────────┴──────────┴───────────────┘
```

### Panel 3: Alertas Prioritarias
```
🔴 [CRÍTICO] Sucursal 1023 - Inventario estampillas: 0 unidades
🔴 [CRÍTICO] Giro bloqueado por lista SAGRILAFT - Sucursal 1001
🟡 [ALERTA]  Consignación pendiente >24h - Sucursal 2003
🟡 [ALERTA]  47 envíos sin despachar - Cierre en 45 min
🔵 [INFO]    3 apartados vencen esta semana - emails enviados
```

---

## 6. Definición de Alertas del Sistema

| Tipo de Alerta | Disparador | Audiencia | Urgencia |
|----------------|-----------|-----------|----------|
| `consignacion_pendiente` | Consignación registrada sin aprobar >4h | Tesorería, Admin | Media |
| `anulacion_solicitada` | Cajero solicita anulación | Supervisor/Admin | Alta |
| `diferencia_faltante` | Se registra una diferencia de caja negativa | Tesorería, Admin | Alta |
| `diferencia_sobrante` | Se registra una diferencia de caja positiva | Tesorería, Admin | Media |
| `moneda_circulante` | Diferencia por redondeo de decimales (CIPOS→sistema) | Tesorería | Baja |
| `inventario_bajo` | `cantidad_actual < cantidad_minima` en cualquier producto | Admin, Almacén | Media |
| `apartado_por_vencer` | Apartado vence en ≤30 días | Admin + cliente (email) | Baja |
| `apartado_vencido` | Apartado venció sin renovar | Admin | Media |
| `orden_inventario` | Almacén envía nuevo inventario → asesor debe aceptar | Cajero/Admin | Media |
| `reposicion_caja` | Solicitud de reposición entre cajas | Admin | Alta |
| `limite_efectivo_caja` | Caja POS supera `limite_alerta` | Admin, Tesorería | Media |
| `cierre_automatico` | Sistema cierra sesión a las 22:00 | Cajero | Alta |

---

## 7. Integraciones de Datos Externas

### 7.1 Sigma (registro de envíos)
- **Dirección:** Sistema POS → Sigma
- **Trigger:** Crear guía nacional/internacional
- **Datos enviados:** número_guia, remitente, destinatario, peso, servicio
- **Datos recibidos:** referencia_sigma (confirmación de registro)
- **Modo:** Asíncrono vía RabbitMQ (producer → consumer → POST Sigma API)
- **Campo en DB:** `envios.referencia_sigma`, `envios.sincronizado_sigma`

### 7.2 Inspektor (listas restrictivas)
- **Dirección:** Sistema POS → Inspektor
- **Trigger:** Antes de aprobar cualquier giro (nacional, MoneyGram, RIA)
- **Datos enviados:** tipo_documento, numero_documento, nombre
- **Datos recibidos:** resultado (limpio/alerta/bloqueado), referencia
- **Modo:** Síncrono (respuesta necesaria antes de continuar)
- **Campo en DB:** `giros.consulta_inspektor`, `giros.resultado_inspektor`, `giros.inspektor_referencia`

### 7.3 Delcop Titanio / DIAN
- **Dirección:** Sistema POS → RabbitMQ → Delcop → DIAN
- **Trigger:** Toda factura electrónica emitida
- **Datos enviados:** datos de la factura completa
- **Datos recibidos:** CUFE (Código Único de Factura Electrónica)
- **Modo:** Asíncrono (no bloquea al cajero)
- **Campo en DB:** `facturas.cufe`, `facturas.enviada_dian`, `facturas.cola_dian_id`

### 7.4 MoneyGram
- **Dirección:** Bidireccional (emisión y pago)
- **Listas restrictivas:** MoneyGram maneja sus propias listas (ya integradas en su API)
- **Modo:** REST API síncrono
- **Pendiente:** Documentación API MoneyGram v2 (sin DLL legacy)

### 7.5 RIA (Euronet Worldwide)
- **Dirección:** Solo pago (no emisión)
- **Autenticación:** PIN 11 dígitos
- **Modo:** REST API v1.6 síncrona
- **Tiempo de respuesta:** Más rápido que MoneyGram según transcripción

### 7.6 IFS (interfaz web propia)
- **Acceso actual:** Interfaz web propia con usuario y clave de IFS (no del sistema POS)
- **Países:** Chile, España, Perú, Uruguay, Cuba (Rep. Dominicana ya **no activo**)
- **Emisión y pago:** Sí (ambas operaciones)
- **Código de autenticación:** Alfanumérico + código secreto del beneficiario
- **Listas restrictivas:** Manual — consulta a Fiat-Tandra con credenciales separadas
- **Integración con caja:** Inmediata (a diferencia de CFS)
- **Pendiente:** Confirmar si IFS expone API REST o SFTP para integración

### 7.7 Giros CFS (FortiClient/VPN)
- **Acceso actual:** FortiClient + VPN → interfaz web de la plataforma CFS
- **Países:** Por confirmar con 4-72
- **Emisión y pago:** Sí (ambas operaciones)
- **Código de autenticación:** Alfanumérico + código secreto
- **Listas restrictivas:** **No integrado** actualmente
- **Impacto en caja:** Sincronización **cada hora** (no en tiempo real)
- **Pendiente:** ¿CFS expone API REST? ¿Credenciales de integración disponibles?

---

## 8. Roadmap de KPIs por Quincena

| Quincena | KPIs disponibles |
|----------|-----------------|
| Q1 | Infraestructura de datos lista. Vistas SQL creadas pero sin datos reales. |
| Q2–Q3 | KPI-CL01, KPI-CL02, KPI-CL03 (clientes), KPI-I01, KPI-I02 (inventario) |
| Q4 | KPI-C01, KPI-C02, KPI-C03, KPI-C04 (cajas y diferencias) |
| Q5–Q7 | KPI-V01, KPI-V02, KPI-V03, KPI-V04, KPI-AP01, KPI-AP02, KPI-D01, KPI-D02 |
| Q8–Q9 | KPI-G01, KPI-G02, KPI-G03, KPI-G04 (giros y cumplimiento) |
| Q10 | KPI-REC01 (recaudos) |
| Q11–Q13 | Dashboard ejecutivo completo, Panel 1-3, reportes Excel, exportación |

---

## 9. Glosario de Términos Operativos

| Término | Definición |
|---------|-----------|
| **Preporteado** | Pago de un servicio usando estampillas (no dinero). La estampilla es el valor del porte. |
| **Mixto preporteado** | Pago parcial en efectivo y parcial en estampillas. Aplica cuando el valor de la estampilla no cubre exactamente el servicio. |
| **Saca** | Bolsa precintada con sobres/paquetes para despacho. Puede ser consolidada (varios tipos) o directa (un solo destino). |
| **Marbete** | Etiqueta adhesiva con código de barras que va en la saca. Permite la trazabilidad en tránsito. |
| **Precinto** | Sello de seguridad numerado que se coloca en la saca al cerrar. |
| **Manifiesto de despacho** | Documento que lista todos los envíos dentro de una saca. Lo firma el transportista al recoger. |
| **Tarifa Postal Reducida (TPR)** | Tipo de cliente con descuento especial. Aplica para organizaciones específicas. |
| **Sisbén** | Sistema de identificación de beneficiarios. Niveles 1-4 con descuentos escalonados. Máx 7 envíos/año. |
| **SPU** | Servicio Postal Universal. Servicios regulados que deben llevar estampilla. |
| **CODE 5** | Formato de dirección normalizado para envíos nacionales. |
| **Moneda circulante** | Diferencia de centavos en caja causada por redondeo (CIPOS usa decimales, el sistema redondea). |
| **Cambio de custodia** | Transferencia de efectivo entre cajas (ej: de Caja General a Caja POS). |
| **Flete del giro** | Comisión de $4.700 por enviar un giro nacional. Puede asumirlo el remitente o el beneficiario. |
| **Formulario 5** | Documento de cumplimiento SAGRILAFT que el cliente firma al emitir/recibir un giro internacional. |
| **Declaración de origen de fondos** | Documento donde el cliente declara de dónde proviene el dinero del giro. |
| **CUFE** | Código Único de Factura Electrónica. Generado por la DIAN al validar la factura. |
| **Expendio** | Punto de venta autorizado por 4-72 para vender algunos de sus productos/servicios. |
| **Aliado** | Empresa aliada comercial con condiciones preferenciales. |
| **Giros CFS** | Plataforma de giros internacionales de terceros, accedida vía FortiClient (VPN). Emite y paga. No integrada con listas restrictivas de 4-72. Su saldo afecta la caja con sincronización cada hora. |
| **FortiClient** | Cliente VPN corporativo (Fortinet). Actualmente se usa para acceder a la plataforma CFS. En el nuevo sistema esta fricción debe eliminarse. |
| **C-POS** | Plataforma de despacho (confección de sacas y generación de manifiestos). Diferente de CIPOS (sistema de facturación de envíos). |
| **Centro A** | Centro operativo destino para sacas nacionales (ej: Bogotá). |
| **C432 / UPX** | Código de centro operativo destino para sacas internacionales. |
| **Fiat-Tandra** | Plataforma externa de listas restrictivas usada para giros IFS. La consulta es manual con usuario y contraseña propios. |
| **DIAL** | Convenio de recaudo actualmente activo en solo 2 puntos de 4-72. |
| **Hereditar** | Sistema biométrico (probable nombre) al que se conecta el POS actual para capturar y validar huellas dactilares en giros nacionales. |
