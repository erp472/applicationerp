# Matemáticas y Ciencia de Datos — Sistema POS 4-72

> Este documento consolida toda la matemática operativa, estadística y de machine learning necesaria para el análisis de datos del sistema.
> Cada fórmula está vinculada a una tabla del modelo de datos y a un KPI o regla de negocio concreta.

---

## 1. Matemática Operativa (Reglas de Negocio)

### 1.1 Peso de envíos — Volumétrico vs Físico

El peso tarificado determina el precio que se cobra al cliente.

**Peso volumétrico:**
```
peso_vol (kg) = (alto_cm × ancho_cm × largo_cm) / factor_volumetrico
```

**Peso tarificado (cobrado al cliente):**
```
peso_tarificado (kg) = MAX(peso_fisico_kg, peso_volumetrico_kg)
```

**Factor volumétrico:** `2500` (estándar IATA/postal, configurable por servicio en `servicios.factor_volumetrico`)

**Ejemplo:**
```
Caja 40cm × 30cm × 20cm, peso físico 1.5 kg
peso_vol = (40 × 30 × 20) / 2500 = 24,000 / 2500 = 9.6 kg
peso_tarificado = MAX(1.5, 9.6) = 9.6 kg  →  se cobra por 9.6 kg
```

**Implementación SQL:**
```sql
UPDATE envios SET
  peso_volumetrico_kg = ROUND((alto_cm * ancho_cm * largo_cm) / factor_volumetrico::numeric, 3),
  peso_tarificado_kg  = GREATEST(peso_fisico_kg,
                                 ROUND((alto_cm * ancho_cm * largo_cm) / factor_volumetrico::numeric, 3))
FROM servicios sv
WHERE envios.servicio_id = sv.id;
```

---

### 1.2 Valor de servicio — Tarificación por rangos de peso

```
valor_servicio = tarifa_base + MAX(0, peso_tarificado - peso_max_tramo_1) × tarifa_kg_adicional
```

**Ejemplo (Correo Certificado Nacional):**

| Tramo | Peso min | Peso max | Tarifa base | Tarifa adicional/kg |
|-------|----------|----------|-------------|---------------------|
| T1 | 0 g | 20 g | $3,200 | — |
| T2 | 21 g | 2,000 g | $3,200 | $1,500/kg |
| T3 | 2,001 g | 5,000 g | $6,200 | $2,000/kg |

```
Para peso_tarificado = 1.5 kg:
valor_servicio = $3,200 + (1.5 - 0.02) × $1,500
              = $3,200 + 1.48 × $1,500
              = $3,200 + $2,220
              = $5,420
```

**SQL de cotización:**
```sql
SELECT
  t.tarifa + GREATEST(0, $peso - t.peso_max_kg) * COALESCE(t.tarifa_kg_adicional, 0) AS valor_servicio
FROM tarifas_servicio t
WHERE t.servicio_id = $servicio_id
  AND t.tipo_cliente_id IS NULL  -- o el tipo del cliente
  AND $peso BETWEEN t.peso_min_kg AND COALESCE(t.peso_max_kg, 999999)
  AND t.activa = true
  AND (t.fecha_vigencia_fin IS NULL OR t.fecha_vigencia_fin >= CURRENT_DATE)
ORDER BY t.peso_min_kg DESC
LIMIT 1;
```

---

### 1.3 Descuentos por tipo de cliente

```
valor_con_descuento = valor_base × (1 - descuento_porcentaje / 100)
```

| Tipo cliente | Descuento |
|-------------|-----------|
| retail | 0% |
| tarifa_postal_reducida | 20% |
| aliado | 15% |
| expendio | 10% |
| sisben_1 | 50% |
| sisben_2 | 40% |
| sisben_3 | 30% |
| sisben_4 | 20% |

**Condición especial Sisbén:**
```
Si cliente.envios_sisben_ano >= 7  →  aplicar tarifa retail (0% descuento)
Si cliente.envios_sisben_ano < 7   →  aplicar descuento Sisbén correspondiente
                                       envios_sisben_ano += 1
```

---

### 1.4 Valor total del envío

```
valor_total = valor_servicio_con_descuento
            + valor_estampillas
            + valor_seguro
```

**Seguro (valor declarado):**
```
valor_seguro = valor_declarado × tasa_seguro
```
Donde `tasa_seguro` es configurable por servicio (típicamente 0.5%–1%).  
Valor declarado máximo: **$15,000,000 COP**.

---

### 1.5 Giros — Cálculo de flete y conversión de moneda

**Giro nacional:**
```
flete_cop       = $4,700 (fijo, configurable)
monto_total_cop = monto_cop + flete_cop  (si flete asumido por remitente)
monto_total_cop = monto_cop              (si flete asumido por beneficiario)
```

**Giro internacional (MoneyGram / RIA):**
```
monto_destino   = monto_cop × tasa_cambio
comision_cop    = f(monto_cop, pais_destino)  ← tabla de tarifas del proveedor
monto_total_cop = monto_cop + comision_cop    (remitente paga todo)
```

---

### 1.6 Saldo estimado de caja

```
saldo_caja = monto_apertura
           + Σ(ingresos)     -- venta_servicio, venta_producto, giro_pago, recaudo, apartado_postal
           - Σ(egresos)      -- giro_emision_cobro, consignacion, cambio_custodia_out
           + Σ(ajustes_pos)  -- cambio_custodia_in, diferencia_sobrante
           - Σ(ajustes_neg)  -- diferencia_faltante
```

**Diferencia de cierre:**
```
diferencia = saldo_estimado - monto_cierre_declarado

Si diferencia > 0  →  sobrante (registrar tipo: 'diferencia_sobrante')
Si diferencia < 0  →  faltante (registrar tipo: 'diferencia_faltante')
Si diferencia = 0  →  caja cuadrada
```

---

### 1.7 Control de cupo Sisbén anual

```
cupo_restante = 7 - cliente.envios_sisben_ano
fecha_reset   = 1 de enero de cada año

Si cupo_restante <= 0:
    aplicar_tarifa_retail()
    mostrar_alerta("Sin cupo Sisbén disponible este año")
Sino:
    aplicar_descuento_sisben(cliente.nivel_sisben)
    envios_sisben_ano += 1
```

**Reset anual (cron 0 0 1 1 \*):**
```sql
UPDATE clientes SET envios_sisben_ano = 0 WHERE nivel_sisben IS NOT NULL;
```

---

## 2. Estadística Descriptiva — KPIs Base

### 2.1 Métricas de centralidad y dispersión por sucursal

Para cada métrica operativa se calculan:

| Estadístico | Fórmula | Uso |
|-------------|---------|-----|
| Media | `μ = Σxᵢ / n` | Baseline de desempeño |
| Desviación estándar | `σ = √(Σ(xᵢ - μ)² / n)` | Variabilidad |
| Mediana | P50 | Robusta a outliers |
| P25, P75 | Cuartiles | Rango intercuartil |
| IQR | `P75 - P25` | Detección de outliers |

**SQL — estadísticos de envíos diarios por sucursal (últimos 30 días):**
```sql
SELECT
  s.nombre AS sucursal,
  COUNT(*)::numeric / 30                    AS promedio_envios_diarios,
  STDDEV(daily.n)                           AS desviacion_envios_diarios,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY daily.n)  AS mediana_envios,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY daily.n) AS p25_envios,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY daily.n) AS p75_envios,
  MAX(daily.n)                              AS max_envios_dia,
  MIN(daily.n)                              AS min_envios_dia
FROM (
  SELECT sucursal_id, created_at::date AS dia, COUNT(*) AS n
  FROM envios
  WHERE created_at >= NOW() - INTERVAL '30 days' AND estado != 'anulado'
  GROUP BY sucursal_id, created_at::date
) daily
JOIN sucursales s ON s.id = daily.sucursal_id
GROUP BY s.nombre;
```

---

### 2.2 Tasa de crecimiento

```
Tasa_crecimiento_mensual = (valor_mes_actual - valor_mes_anterior) / valor_mes_anterior × 100
```

**Tasa de crecimiento compuesta (CAGR) — períodos largos:**
```
CAGR = (valor_final / valor_inicial)^(1/n_periodos) - 1
```

**SQL:**
```sql
WITH mensual AS (
  SELECT
    DATE_TRUNC('month', created_at) AS mes,
    SUM(valor_total) AS ingreso
  FROM envios
  WHERE estado != 'anulado'
  GROUP BY mes
)
SELECT
  mes,
  ingreso,
  LAG(ingreso) OVER (ORDER BY mes) AS ingreso_mes_anterior,
  ROUND((ingreso - LAG(ingreso) OVER (ORDER BY mes)) * 100.0
        / NULLIF(LAG(ingreso) OVER (ORDER BY mes), 0), 2) AS crecimiento_pct
FROM mensual
ORDER BY mes;
```

---

### 2.3 Tasa de anulaciones

```
tasa_anulacion = (n_anuladas_aprobadas / n_total_facturadas) × 100

Semáforo:
  ≤ 2%   → Normal
  2-5%   → Atención
  > 5%   → Crítico (auditoría)
```

**SQL:**
```sql
SELECT
  u.nombre AS cajero,
  s.nombre AS sucursal,
  COUNT(e.id)                                             AS total_facturadas,
  COUNT(a.id)                                             AS anuladas,
  ROUND(COUNT(a.id) * 100.0 / NULLIF(COUNT(e.id), 0), 2) AS tasa_anulacion_pct,
  CASE
    WHEN COUNT(a.id) * 100.0 / NULLIF(COUNT(e.id), 0) <= 2  THEN 'Normal'
    WHEN COUNT(a.id) * 100.0 / NULLIF(COUNT(e.id), 0) <= 5  THEN 'Atención'
    ELSE 'Crítico'
  END AS semaforo
FROM envios e
JOIN usuarios u   ON u.id = e.usuario_id
JOIN sucursales s ON s.id = e.sucursal_id
LEFT JOIN anulaciones a ON a.referencia_id = e.id AND a.estado = 'aprobada'
WHERE e.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.nombre, s.nombre
HAVING COUNT(e.id) > 5;  -- mínimo 5 transacciones para ser significativo
```

---

### 2.4 Índice de cumplimiento Inspektor

```
tasa_bloqueo     = (n_bloqueados / n_consultados) × 100
tasa_alertas     = (n_alertas    / n_consultados) × 100
tasa_limpio      = (n_limpios    / n_consultados) × 100

Invariante: tasa_bloqueo + tasa_alertas + tasa_limpio = 100%
```

Una tasa de bloqueo alta en una sucursal específica puede indicar:
- Zona geográfica con mayor riesgo
- Cajero que omite validaciones
- Clientes de perfil alto riesgo

---

### 2.5 Coeficiente de variación (CV) — Estabilidad operativa

```
CV = (σ / μ) × 100
```

Un CV bajo indica sucursal estable. Un CV alto indica alta variabilidad (días muy buenos y días muy malos).

**Uso:** Segmentar sucursales en clusters de comportamiento.

```sql
SELECT
  s.nombre,
  AVG(daily.ingresos)                                AS media_ingresos,
  STDDEV(daily.ingresos)                             AS desv_std,
  ROUND(STDDEV(daily.ingresos) * 100.0
        / NULLIF(AVG(daily.ingresos), 0), 2)         AS coeficiente_variacion_pct
FROM (
  SELECT sucursal_id, created_at::date AS dia,
         SUM(valor_total) AS ingresos
  FROM envios
  WHERE created_at >= NOW() - INTERVAL '90 days' AND estado != 'anulado'
  GROUP BY sucursal_id, created_at::date
) daily
JOIN sucursales s ON s.id = daily.sucursal_id
GROUP BY s.nombre
ORDER BY coeficiente_variacion_pct DESC;
```

---

## 3. Series de Tiempo

### 3.1 Media Móvil Simple (MMS) — Tendencia de ingresos

```
MMS_k(t) = (1/k) × Σᵢ₌₀ᵏ⁻¹ xₜ₋ᵢ

Donde k = ventana de días (7 para semanal, 30 para mensual)
```

**Uso:** Suavizar la volatilidad diaria para ver la tendencia real de una sucursal.

**SQL (MMS 7 días):**
```sql
SELECT
  dia,
  ingresos,
  AVG(ingresos) OVER (
    ORDER BY dia
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS mms_7dias
FROM (
  SELECT created_at::date AS dia, SUM(valor_total) AS ingresos
  FROM envios
  WHERE sucursal_id = $sucursal_id AND estado != 'anulado'
  GROUP BY created_at::date
) daily
ORDER BY dia;
```

---

### 3.2 Media Móvil Exponencial (MME) — Mayor peso a datos recientes

```
MME(t) = α × x(t) + (1 - α) × MME(t-1)

α = factor de suavizado = 2 / (k + 1)
```

Ejemplo con k=7: `α = 2/8 = 0.25`

**Implementación Python (para análisis offline):**
```python
import pandas as pd

df['mme_7d'] = df['ingresos'].ewm(span=7, adjust=False).mean()
df['mme_30d'] = df['ingresos'].ewm(span=30, adjust=False).mean()
```

---

### 3.3 Estacionalidad — Identificación de patrones temporales

**Índice de estacionalidad por día de semana:**
```
IS_dia_semana(d) = media_dia_d / media_global × 100
```

```sql
SELECT
  TO_CHAR(created_at, 'Day') AS dia_semana,
  EXTRACT(DOW FROM created_at) AS n_dia,  -- 0=domingo, 6=sábado
  AVG(daily.ingresos) AS media_ingresos,
  AVG(daily.ingresos) / AVG(AVG(daily.ingresos)) OVER () * 100 AS indice_estacionalidad
FROM (
  SELECT created_at::date, SUM(valor_total) AS ingresos
  FROM envios WHERE estado != 'anulado'
  GROUP BY created_at::date
) daily
JOIN generate_series(0,6) AS dow(n) ON EXTRACT(DOW FROM daily.created_at::date) = dow.n
GROUP BY dia_semana, n_dia
ORDER BY n_dia;
```

**Índice de estacionalidad mensual:**
```sql
SELECT
  EXTRACT(MONTH FROM created_at) AS mes,
  TO_CHAR(created_at, 'Month') AS nombre_mes,
  SUM(valor_total) AS ingreso_mes,
  SUM(valor_total) / AVG(SUM(valor_total)) OVER () * 100 AS indice_estacionalidad
FROM envios
WHERE estado != 'anulado'
  AND created_at >= NOW() - INTERVAL '2 years'
GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Month')
ORDER BY mes;
```

---

### 3.4 Descomposición de serie de tiempo (STL)

```
Y(t) = Tendencia(t) + Estacionalidad(t) + Residuo(t)
```

**Uso:** Separar qué parte del crecimiento (o caída) de ingresos es tendencia real vs efecto estacional.

**Implementación Python:**
```python
from statsmodels.tsa.seasonal import STL

stl = STL(serie_ingresos, period=7)  # estacionalidad semanal
resultado = stl.fit()

tendencia      = resultado.trend
estacionalidad = resultado.seasonal
residuo        = resultado.resid
```

---

## 4. Forecasting (Pronóstico de Demanda)

### 4.1 Suavizado Exponencial de Holt-Winters (Triple)

Modelo para series con tendencia + estacionalidad.

```
Nivel:       L(t) = α × (Y(t) - S(t-m))   + (1-α) × (L(t-1) + T(t-1))
Tendencia:   T(t) = β × (L(t) - L(t-1))   + (1-β) × T(t-1)
Estacional:  S(t) = γ × (Y(t) - L(t))     + (1-γ) × S(t-m)
Pronóstico:  Ŷ(t+h) = (L(t) + h×T(t)) × S(t-m+h mod m)

Parámetros:  α, β, γ ∈ [0, 1]   (optimizados por mínimos cuadrados)
             m = período estacional (7 días)
```

**Uso en 4-72:** Proyectar ingresos por sucursal para las próximas 2 semanas. Permite planear:
- Cuántos cajeros poner en turno
- Cuántas estampillas pedir al almacén
- Cuándo reforzar efectivo en caja

**Implementación Python:**
```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing

modelo = ExponentialSmoothing(
    serie_ingresos_diarios,
    trend='add',
    seasonal='add',
    seasonal_periods=7  # ciclo semanal
)
resultado = modelo.fit()
pronostico_14_dias = resultado.forecast(14)
```

---

### 4.2 ARIMA — Modelos autoregresivos

Para series estacionarias o con transformación logarítmica.

```
ARIMA(p, d, q):
  p = orden autoregresivo   (cuántos días pasados influyen)
  d = diferenciación        (para hacer la serie estacionaria)
  q = orden media móvil

Y(t) = c + φ₁Y(t-1) + ... + φₚY(t-p)
         + θ₁ε(t-1) + ... + θqε(t-q) + ε(t)
```

**Selección automática de parámetros (auto-ARIMA):**
```python
import pmdarima as pm

modelo = pm.auto_arima(
    serie_ingresos,
    seasonal=True, m=7,      # estacionalidad semanal
    stepwise=True,
    information_criterion='aic',
    max_p=5, max_q=5, max_d=2
)
pronostico = modelo.predict(n_periods=14)
```

**Criterio de selección:**
- **AIC:** `AIC = 2k - 2ln(L)` (penaliza complejidad del modelo)
- **BIC:** `BIC = k×ln(n) - 2ln(L)` (más penalización que AIC)

Elegir el modelo con menor AIC/BIC.

---

### 4.3 Prophet — Forecasting con regresores externos

Útil cuando hay días festivos o eventos especiales que rompen la estacionalidad.

```python
from prophet import Prophet

modelo = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False
)

# Agregar festivos colombianos
festivos_co = Prophet.make_holidays_df(
    year_list=[2025, 2026, 2027],
    country='CO'
)
modelo.add_country_holidays(country_name='CO')

modelo.fit(df[['ds', 'y']])  # ds=fecha, y=ingreso

futuro = modelo.make_future_dataframe(periods=30)
pronostico = modelo.predict(futuro)
```

**Variables exógenas sugeridas:**
- `dia_festivo`: binaria (1 si festivo colombiano)
- `dia_pago_nomina`: 1 en los 1–5 y 15–20 de cada mes (mayor demanda de giros y recaudos)
- `quincena`: 1 en primera quincena, 2 en segunda

---

### 4.4 Evaluación de modelos de pronóstico

| Métrica | Fórmula | Interpretación |
|---------|---------|----------------|
| MAE | `(1/n) × Σ|Yᵢ - Ŷᵢ|` | Error promedio en unidades originales |
| RMSE | `√((1/n) × Σ(Yᵢ - Ŷᵢ)²)` | Penaliza errores grandes |
| MAPE | `(1/n) × Σ|Yᵢ - Ŷᵢ|/Yᵢ × 100` | Error porcentual (comparables) |
| R² | `1 - SS_res/SS_tot` | Proporción de varianza explicada |

**Target de desempeño:** MAPE ≤ 15% a 7 días, ≤ 25% a 30 días.

---

## 5. Detección de Anomalías

### 5.1 Regla de las 3 Sigma (Z-score)

```
Z(x) = (x - μ) / σ

Anomalía si |Z| > 3  →  el valor está a más de 3 desviaciones de la media
```

**Aplicaciones en 4-72:**
- Detectar una sucursal con ingresos anómalamente altos o bajos un día específico
- Detectar un cajero con tasa de anulaciones anómala
- Detectar montos de giro anómalamente altos (posible lavado)

**SQL:**
```sql
WITH stats AS (
  SELECT
    sucursal_id,
    AVG(ingresos)    AS media,
    STDDEV(ingresos) AS desv
  FROM (
    SELECT sucursal_id, created_at::date AS dia, SUM(valor_total) AS ingresos
    FROM envios WHERE estado != 'anulado'
    GROUP BY sucursal_id, created_at::date
  ) d GROUP BY sucursal_id
)
SELECT
  e.sucursal_id,
  e.dia,
  e.ingresos,
  st.media,
  st.desv,
  ROUND((e.ingresos - st.media) / NULLIF(st.desv, 0), 2) AS z_score,
  CASE WHEN ABS((e.ingresos - st.media) / NULLIF(st.desv, 0)) > 3
       THEN 'ANOMALÍA' ELSE 'Normal' END AS estado
FROM (
  SELECT sucursal_id, created_at::date AS dia, SUM(valor_total) AS ingresos
  FROM envios WHERE estado != 'anulado'
  GROUP BY sucursal_id, created_at::date
) e
JOIN stats st ON st.sucursal_id = e.sucursal_id
WHERE ABS((e.ingresos - st.media) / NULLIF(st.desv, 0)) > 2.5
ORDER BY ABS((e.ingresos - st.media) / NULLIF(st.desv, 0)) DESC;
```

---

### 5.2 Rango Intercuartil (IQR) — Detección robusta

```
IQR = Q3 - Q1
Límite inferior = Q1 - 1.5 × IQR
Límite superior = Q3 + 1.5 × IQR

Outlier si x < Límite_inferior  OR  x > Límite_superior
```

Más robusto que Z-score cuando la distribución no es normal.

**SQL (percentiles en PostgreSQL):**
```sql
SELECT
  sucursal_id,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monto_cop) AS q1,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monto_cop) AS q3,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monto_cop)
    - PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monto_cop) AS iqr
FROM giros
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY sucursal_id;
```

---

### 5.3 Isolation Forest — Detección multivariable

Para detectar transacciones sospechosas considerando múltiples variables simultáneamente.

```
Puntaje de anomalía ∈ [0, 1]
  → Cercano a 1: muy anómalo
  → Cercano a 0.5: normal
```

**Variables a usar para giros:**
- `monto_cop`
- `hora_del_dia`
- `dia_semana`
- `n_giros_cajero_dia`
- `n_giros_cliente_mes`

**Implementación Python:**
```python
from sklearn.ensemble import IsolationForest
import pandas as pd

df_giros = pd.DataFrame({...})  # cargar desde DB

features = ['monto_cop', 'hora', 'dia_semana', 'n_cajero_dia', 'n_cliente_mes']
X = df_giros[features]

modelo = IsolationForest(contamination=0.02, random_state=42)
df_giros['anomaly_score'] = modelo.fit_predict(X)
df_giros['is_anomaly'] = df_giros['anomaly_score'] == -1
```

---

### 5.4 Detección de diferencias de caja — Control estadístico del proceso (SPC)

**Gráfico de control (X-bar y R):**
```
LCL = μ - 3σ/√n      (límite de control inferior)
UCL = μ + 3σ/√n      (límite de control superior)

Si diferencia_cierre ∉ [LCL, UCL]  →  proceso fuera de control
```

**Reglas de Western Electric (señales de alerta):**
1. Un punto fuera de ±3σ → alerta inmediata
2. Dos de tres puntos consecutivos en zona >2σ → tendencia
3. Cuatro de cinco en zona >1σ → sesgo
4. Ocho puntos consecutivos al mismo lado de μ → turno/cajero específico

---

## 6. Análisis de Clusters (Segmentación)

### 6.1 Clustering de sucursales por perfil de negocio

**Objetivo:** Agrupar las 65 sucursales en perfiles homogéneos para asignar estrategias diferenciadas.

**Variables de clustering:**
```python
variables = [
    'ingresos_promedio_dia',       # nivel de actividad
    'mix_envios_pct',              # % de ingreso por envíos
    'mix_giros_pct',               # % de ingreso por giros
    'mix_recaudos_pct',            # % de ingreso por recaudos
    'tasa_internacional_pct',      # % de envíos internacionales
    'tasa_anulacion_pct',          # calidad operativa
    'coeficiente_variacion',       # estabilidad
    'tipo_unipersonal',            # binaria
]
```

**Algoritmo K-Means:**
```python
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import numpy as np

# Normalización
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df_sucursales[variables])

# Selección del k óptimo (método del codo)
inercias = []
for k in range(2, 10):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    inercias.append(km.inertia_)

# Entrenar con k óptimo (ej: k=4)
km_final = KMeans(n_clusters=4, random_state=42, n_init=10)
df_sucursales['cluster'] = km_final.fit_predict(X_scaled)
```

**Perfiles esperados (hipótesis):**
| Cluster | Perfil | Características |
|---------|--------|-----------------|
| A | Alto volumen postal | Muchos envíos, pocos giros, unipersonal |
| B | Alto volumen financiero | Muchos giros, MoneyGram/RIA activo |
| C | Mixto urbano | Equilibrio entre servicios, alta variabilidad |
| D | Bajo volumen | Pocas transacciones, posible candidato a rediseño |

**Métrica de calidad:** Silhouette Score ∈ [-1, 1]. Objetivo: > 0.4.

```python
from sklearn.metrics import silhouette_score
score = silhouette_score(X_scaled, df_sucursales['cluster'])
```

---

### 6.2 Segmentación de clientes (RFM)

**Recencia-Frecuencia-Monetario:**

```
R = días desde la última transacción
F = número de transacciones en los últimos 12 meses
M = valor total de transacciones en los últimos 12 meses
```

**SQL:**
```sql
SELECT
  c.id AS cliente_id,
  c.nombre,
  c.tipo_cliente_id,
  CURRENT_DATE - MAX(e.created_at::date)          AS recencia_dias,
  COUNT(e.id)                                     AS frecuencia,
  SUM(e.valor_total)                              AS monetario
FROM clientes c
JOIN envios e ON e.cliente_id = c.id
WHERE e.created_at >= NOW() - INTERVAL '12 months'
  AND e.estado != 'anulado'
GROUP BY c.id, c.nombre, c.tipo_cliente_id
ORDER BY monetario DESC;
```

**Puntuación RFM (quintiles 1–5):**
```python
df['R_score'] = pd.qcut(df['recencia_dias'], q=5, labels=[5,4,3,2,1])
df['F_score'] = pd.qcut(df['frecuencia'],    q=5, labels=[1,2,3,4,5])
df['M_score'] = pd.qcut(df['monetario'],     q=5, labels=[1,2,3,4,5])
df['RFM']     = df['R_score'].astype(str) + df['F_score'].astype(str) + df['M_score'].astype(str)
```

**Segmentos resultantes:**

| Segmento | RFM | Descripción | Acción |
|----------|-----|-------------|--------|
| Campeones | 555 | Compran frecuente, mucho valor, reciente | Premiar |
| Fieles | 4-5, 4-5 | Compran seguido | Retener |
| En riesgo | 2, 4-5 | Eran buenos, no vuelven | Recuperar |
| Perdidos | 1, 1-2 | Sin actividad reciente | Reactivar o ignorar |
| Nuevos | 5, 1, 1 | Primera compra reciente | Nutrir |

---

## 7. Regresión y Predicción de Ingresos

### 7.1 Regresión Lineal Múltiple

```
Y = β₀ + β₁X₁ + β₂X₂ + ... + βₙXₙ + ε

Donde:
  Y  = ingreso_total_dia
  X₁ = n_cajeros_activos
  X₂ = es_festivo (0/1)
  X₃ = dia_semana (1-7)
  X₄ = semana_del_mes (1-4)
  X₅ = temperatura (proxy de condiciones externas)
  ε  = error aleatorio ~ N(0, σ²)
```

**Estimación por mínimos cuadrados ordinarios (OLS):**
```
β = (XᵀX)⁻¹ Xᵀy
```

**Implementación Python:**
```python
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

modelo = LinearRegression()
modelo.fit(X_train, y_train)
y_pred = modelo.predict(X_test)

print(f"R²: {r2_score(y_test, y_pred):.3f}")
print(f"MAE: ${mean_absolute_error(y_test, y_pred):,.0f}")
```

---

### 7.2 Regresión con Regularización (Ridge / Lasso)

Para cuando hay muchas variables correlacionadas.

**Ridge (L2):**
```
Minimizar: Σ(Yᵢ - Ŷᵢ)² + λ × Σβⱼ²
```

**Lasso (L1) — genera variables con coeficiente 0 (selección automática):**
```
Minimizar: Σ(Yᵢ - Ŷᵢ)² + λ × Σ|βⱼ|
```

Elegir λ por validación cruzada (cross-validation):
```python
from sklearn.linear_model import RidgeCV, LassoCV

ridge = RidgeCV(alphas=[0.01, 0.1, 1, 10, 100], cv=5)
ridge.fit(X_train, y_train)
print(f"Lambda óptimo: {ridge.alpha_}")
```

---

### 7.3 Gradient Boosting — XGBoost para predicción de ingresos

Para capturar relaciones no lineales entre variables.

```python
import xgboost as xgb

modelo = xgb.XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
modelo.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    early_stopping_rounds=50,
    verbose=False
)
```

**Importancia de variables (SHAP values):**
```python
import shap
explainer = shap.TreeExplainer(modelo)
shap_values = explainer.shap_values(X_test)
shap.summary_plot(shap_values, X_test, feature_names=feature_names)
```

---

## 8. Optimización

### 8.1 Optimización de base de caja por punto de venta

**Problema:** ¿Cuánto dinero asignar a cada caja al inicio del día para minimizar tanto el riesgo de quedarse sin efectivo (para pagar giros) como el exceso de liquidez inmovilizada?

**Función objetivo:**
```
Minimizar: C_faltante × P(saldo < 0) + C_exceso × E[max(0, saldo_final)]

Donde:
  C_faltante = costo de no poder pagar un giro (pérdida de cliente + gestión)
  C_exceso   = costo de oportunidad del efectivo inmovilizado
```

**Modelo simplificado — percentil de cobertura:**
```
base_optima = PERCENTILE(demanda_historica_diaria, percentil_cobertura)

Percentil sugerido por tipo de caja:
  Caja Menor (reserva): P75
  Caja General:         P90
  Caja POS:             P80 de la demanda del cajero específico
```

**SQL — histórico de demanda por caja:**
```sql
SELECT
  caja_id,
  PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY demanda_dia) AS base_recomendada_p80,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY demanda_dia) AS base_recomendada_p90
FROM (
  SELECT
    sc.caja_id,
    sc.fecha_apertura::date AS dia,
    SUM(CASE WHEN mc.tipo IN ('giro_pago','giro_emision_cobro') THEN mc.monto ELSE 0 END) AS demanda_dia
  FROM sesiones_caja sc
  JOIN movimientos_caja mc ON mc.sesion_caja_id = sc.id
  WHERE sc.fecha_apertura >= NOW() - INTERVAL '90 days'
  GROUP BY sc.caja_id, sc.fecha_apertura::date
) daily
GROUP BY caja_id;
```

---

### 8.2 Optimización de inventario de estampillas — Modelo EOQ

**Economic Order Quantity (cantidad económica de pedido):**
```
EOQ = √(2 × D × K / h)

Donde:
  D = demanda anual (unidades)
  K = costo fijo de hacer un pedido (transporte desde almacén)
  h = costo de mantener una unidad en inventario por año (dinero inmovilizado)

Punto de reorden:
  ROP = d × L + Z × σd × √L

Donde:
  d  = demanda promedio diaria
  L  = tiempo de entrega del almacén (días)
  Z  = factor de nivel de servicio (Z=1.65 para 95%)
  σd = desviación estándar de la demanda diaria
```

**Ejemplo:**
```
D  = 500 estampillas/año
K  = $5,000 (costo de envío desde almacén)
h  = $100/año × valor_unitario/valor_unitario   (tasa 5% sobre el valor)
   = 0.05 × $1,600 = $80/unidad/año

EOQ = √(2 × 500 × 5000 / 80) = √62,500 = 250 estampillas

Tiempo de entrega: 3 días
d = 500/365 = 1.37 unidades/día
σd = 0.5 unidades/día

ROP = 1.37 × 3 + 1.65 × 0.5 × √3 = 4.11 + 1.43 = 5.54 ≈ 6 unidades
      → Hacer pedido cuando el stock llegue a 6 unidades
```

---

## 9. Análisis de Riesgo y Cumplimiento

### 9.1 Score de riesgo para giros (SAGRILAFT)

**Variables de entrada:**
```
r(giro) = w₁ × monto_normalizado
        + w₂ × frecuencia_cliente_mes
        + w₃ × destino_riesgo_pais
        + w₄ × diferencia_perfil_economico
        + w₅ × cliente_en_lista_parcial
```

**Implementación (regla scoring simple):**
```python
def score_riesgo(giro: dict) -> float:
    score = 0.0

    # Monto alto
    if giro['monto_cop'] > 2_000_000:
        score += 0.30
    elif giro['monto_cop'] > 800_000:
        score += 0.15

    # Frecuencia inusual (más de 3 giros en el mes)
    if giro['n_giros_cliente_mes'] > 3:
        score += 0.25

    # País de destino de alto riesgo (lista OFAC/FATF)
    if giro['pais_destino'] in PAISES_ALTO_RIESGO:
        score += 0.30

    # Sin cédula (destinatario sin documento)
    if not giro['beneficiario_tiene_doc']:
        score += 0.15

    return min(score, 1.0)  # normalizar a [0, 1]

# Umbrales
# score < 0.3  → automático
# 0.3–0.6      → revisión manual
# > 0.6        → bloqueo y consulta Inspektor obligatoria
```

---

### 9.2 Límites regulatorios (MinTIC / SAGRILAFT)

```
Umbral de reporte obligatorio al MinTIC:
  Giro individual     > $3,000,000 COP  → reporte inmediato
  Giros acumulados    > $7,500,000 COP en el mes por cliente → reporte
  Operaciones en efectivo > $10,000 USD equivalente → reporte UIAF

Límites por operación:
  Giro nacional       sin límite (con documentación completa)
  Giro MoneyGram      hasta USD 10,000 por transacción
  Valor declarado     máximo $15,000,000 COP por envío
```

**SQL — monitoreo de clientes que se acercan al umbral mensual:**
```sql
SELECT
  COALESCE(remitente_id::text, remitente_numero_doc) AS cliente,
  remitente_nombre,
  SUM(monto_cop) AS total_mes,
  COUNT(*) AS n_giros,
  CASE
    WHEN SUM(monto_cop) > 7500000 THEN '🔴 SUPERA UMBRAL'
    WHEN SUM(monto_cop) > 5000000 THEN '🟡 CERCA DEL UMBRAL'
    ELSE '🟢 Normal'
  END AS estado_regulatorio
FROM giros
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  AND estado = 'aprobado'
GROUP BY COALESCE(remitente_id::text, remitente_numero_doc), remitente_nombre
HAVING SUM(monto_cop) > 3000000
ORDER BY total_mes DESC;
```

---

## 10. Resumen de Librerías Necesarias

### Python (para análisis y modelos)
```txt
# requirements-datascience.txt
pandas==2.2.0
numpy==1.26.0
scipy==1.12.0
scikit-learn==1.4.0
statsmodels==0.14.1
prophet==1.1.5
xgboost==2.0.3
lightgbm==4.3.0
shap==0.44.1
pmdarima==2.0.4
matplotlib==3.8.0
seaborn==0.13.2
plotly==5.20.0
psycopg2-binary==2.9.9
SQLAlchemy==2.0.27
jupyter==1.0.0
```

### PostgreSQL — funciones estadísticas nativas
```sql
-- Disponibles sin extensiones adicionales
AVG(), STDDEV(), VARIANCE()
PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY x)  -- percentil exacto
PERCENTILE_DISC(p) WITHIN GROUP (ORDER BY x)  -- percentil discreto
CORR(x, y)                                    -- correlación de Pearson
COVAR_SAMP(x, y)                              -- covarianza muestral
LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE()     -- funciones de ventana
```

---

## 11. Pipeline de Datos Recomendado

```
PostgreSQL (OLTP)
    │
    ▼ (cada noche 2AM — proceso ERP existente)
PostgreSQL Réplica Lectura
    │
    ▼ (ETL con dbt o Python)
Data Warehouse (esquema estrella)
    ├── fact_envios
    ├── fact_giros
    ├── fact_recaudos
    ├── fact_movimientos_caja
    ├── dim_sucursales
    ├── dim_clientes
    ├── dim_servicios
    ├── dim_tiempo
    └── dim_cajeros
    │
    ▼
Capa de Análisis
    ├── Vistas SQL (KPIs operativos — tiempo real)
    ├── Jupyter Notebooks (análisis exploratorio)
    ├── Modelos ML (Prophet, XGBoost, Isolation Forest)
    └── Grafana (dashboards — conecta directo a PostgreSQL)
```

**Esquema estrella — fact_envios:**
```sql
CREATE TABLE fact_envios (
  id                  UUID,
  fecha_id            INTEGER,        -- FK a dim_tiempo
  sucursal_id         UUID,           -- FK a dim_sucursales
  cajero_id           UUID,           -- FK a dim_cajeros
  cliente_id          UUID,           -- FK a dim_clientes
  servicio_id         UUID,           -- FK a dim_servicios
  peso_tarificado_kg  NUMERIC(8,3),
  valor_servicio      NUMERIC(18,2),
  valor_total         NUMERIC(18,2),
  es_anulado          BOOLEAN,
  tipo_envio          VARCHAR(30),
  medio_pago          VARCHAR(30)
);

-- Tabla de hechos optimizada para queries analíticas (columnar si se usa Redshift/BigQuery)
```
