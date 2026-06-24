# Diccionario de Bookmarks — Sistema POS 4-72

> Cada bookmark identifica un POC (Proof of Concept) de backend NestJS.
> Formato: `#POC-{MÓDULO}-{NRO}` | Quincena (Q): 1–13

## Índice rápido

| Bookmark | Módulo | Endpoint(s) | Q |
|----------|--------|-------------|---|
| [#POC-AUTH-001](#poc-auth-001) | Auth | POST /auth/login · GET /auth/me | Q1 |
| [#POC-PARAM-001](#poc-param-001) | Comercios/Sucursales | GET/POST /sucursales | Q1 |
| [#POC-SYNC-001](#poc-sync-001) | Sync offline | POST /sync/push · GET /sync/pull/:id | Q1 |
| [#POC-CLI-001](#poc-cli-001) | Clientes | GET/POST/PUT /clientes | Q2 |
| [#POC-CLI-002](#poc-cli-002) | Tipos cliente | GET/POST /tipos-cliente | Q2 |
| [#POC-INV-001](#poc-inv-001) | Inventario | GET /inventario/sucursal/:id | Q2 |
| [#POC-INV-002](#poc-inv-002) | Órdenes almacén | POST /ordenes-inventario | Q2 |
| [#POC-ENV-004](#poc-env-004) | Estampillas SPU | POST /envios/calcular-estampillas | Q2 |
| [#POC-CAJA-001](#poc-caja-001) | Apertura/Cierre caja | POST /cajas/:id/abrir | Q4 |
| [#POC-CAJA-002](#poc-caja-002) | Consignaciones | POST /consignaciones | Q4 |
| [#POC-CAJA-004](#poc-caja-004) | Diferencias | POST /cajas/diferencia | Q4 |
| [#POC-ALERT-001](#poc-alert-001) | Motor alertas | GET /alertas | Q4 |
| [#POC-ENV-001](#poc-env-001) | Cotizador envío | POST /envios/cotizar | Q5 |
| [#POC-ENV-002](#poc-env-002) | Facturación guía | POST /envios | Q5 |
| [#POC-ENV-003](#poc-env-003) | Báscula USB/Serial | GET /hardware/bascula/peso | Q5 |
| [#POC-APT-001](#poc-apt-001) | Apartado postal | POST /apartados/vender | Q5 |
| [#POC-APT-002](#poc-apt-002) | Alertas vencimiento | GET /apartados/por-vencer | Q5 |
| [#POC-INTL-001](#poc-intl-001) | Envío MS/UPU | POST /envios/internacional/ms | Q6 |
| [#POC-INTL-003](#poc-intl-003) | Sigma API | POST /sigma/registrar-paquete | Q6 |
| [#POC-FACT-001](#poc-fact-001) | Recibo EPSON | POST /facturas/recibo | Q6 |
| [#POC-FACT-002](#poc-fact-002) | Factura DIAN | [queue] dian.invoice.create | Q6 |
| [#POC-DESP-001](#poc-desp-001) | Crear saca | POST /sacas | Q7 |
| [#POC-DESP-002](#poc-desp-002) | Ingresar envíos | POST /sacas/:id/envios | Q7 |
| [#POC-DESP-003](#poc-desp-003) | Cerrar saca | POST /sacas/:id/cerrar | Q7 |
| [#POC-CAJA-003](#poc-caja-003) | Reposición caja | POST /cajas/reposicion | Q7 |
| [#POC-INV-003](#poc-inv-003) | Alerta stock mínimo | GET /inventario/alertas/critico | Q7 |
| [#POC-INTL-002](#poc-intl-002) | Documentos intl. | POST /envios/:id/generar-documentos | Q7 |
| [#POC-GIRO-001](#poc-giro-001) | Giro nacional emitir | POST /giros/nacional/emitir | Q8 |
| [#POC-GIRO-002](#poc-giro-002) | Giro nacional pagar | POST /giros/nacional/pagar | Q8 |
| [#POC-GIRO-006](#poc-giro-006) | Inspektor SAGRILAFT | POST /cumplimiento/consultar | Q8 |
| [#POC-GIRO-003](#poc-giro-003) | MoneyGram | POST /giros/moneygram/emitir · /pagar | Q9 |
| [#POC-GIRO-004](#poc-giro-004) | RIA PIN 11 dígitos | POST /giros/ria/pagar | Q9 |
| [#POC-GIRO-005](#poc-giro-005) | IFS (web + listas manuales) | POST /giros/ifs/emitir · /pagar | Q9 |
| [#POC-GIRO-007](#poc-giro-007) | CFS FortiClient/VPN | POST /giros/cfs/emitir · /pagar | Q9 |
| [#POC-REC-001](#poc-rec-001) | Recaudos convenios | POST /recaudos | Q10 |
| [#POC-KPI-001](#poc-kpi-001) | Estado cajas | GET /kpis/cajas/estado | Q11 |
| [#POC-KPI-002](#poc-kpi-002) | Ventas del día | GET /kpis/ventas/dia | Q11 |
| [#POC-KPI-003](#poc-kpi-003) | Dashboard giros | GET /kpis/giros/dia | Q11 |
| [#POC-KPI-004](#poc-kpi-004) | Diferencias hist. | GET /kpis/diferencias | Q11 |
| [#POC-KPI-005](#poc-kpi-005) | Inventario crítico | GET /kpis/inventario/critico | Q11 |
| [#POC-KPI-006](#poc-kpi-006) | Apartados vencer | GET /kpis/apartados/por-vencer | Q11 |
| [#POC-KPI-007](#poc-kpi-007) | Ranking sucursales | GET /kpis/ranking/sucursales | Q11 |
| [#POC-KPI-008](#poc-kpi-008) | Análisis anulaciones | GET /kpis/anulaciones | Q11 |

---

## Detalle por módulo

### #POC-AUTH-001
**Módulo:** Auth JWT + roles + MAC guard  
**Archivo:** `apps/api/src/modules/auth/auth.service.ts`  
**Estado:** ✅ Implementado (Q1)  
**Endpoints:**
- `POST /v1/auth/login` — body: `{email, password}`, header: `X-MAC-Address`
- `GET /v1/auth/me` — requiere Bearer token

**JWT payload:** `{ sub, email, rol, sucursal_id, nombre }`  
**Roles disponibles:** `cajero | administrativo | tesoreria | inventarios | supervisor_regional | admin_nacional | admin_sistema`  
**MAC guard:** Header `X-MAC-Address` se valida contra tabla `equipos_autorizados`.

---

### #POC-PARAM-001
**Módulo:** Parámetros — Comercios / Regionales / Sucursales  
**Archivo:** `apps/api/src/modules/comercios/comercios.service.ts`  
**Estado:** ✅ Implementado (Q1)  
**Endpoints:**
- `GET /v1/sucursales` — lista con regional y comercio
- `GET /v1/sucursales/:id` — detalle
- `POST /v1/sucursales` — crear (roles: admin_nacional, admin_sistema)
- `PUT /v1/sucursales/:id/config` — actualizar horario/contacto
- `GET /v1/regionales` — lista regionales

---

### #POC-SYNC-001
**Módulo:** Sincronización offline (SQLite Tauri → central)  
**Archivo:** `apps/api/src/modules/sync/sync.service.ts`  
**Estado:** 🔲 Pendiente (Q1)  
**Endpoints:**
- `POST /v1/sync/push` — recibe batch de operaciones offline
- `GET /v1/sync/pull/:sucursalId` — delta de cambios desde timestamp

---

### #POC-CLI-001
**Módulo:** CRUD Clientes con búsqueda por nombre/documento  
**Archivo:** `apps/api/src/modules/clientes/clientes.service.ts`  
**Estado:** 🔲 Pendiente (Q2)  
**Endpoints:**
- `GET /v1/clientes/buscar?q=` — búsqueda por nombre (pg_trgm) o doc
- `GET /v1/clientes/:id`
- `POST /v1/clientes` — validar tipo_documento + numero_documento único
- `PUT /v1/clientes/:id`

---

### #POC-CLI-002
**Módulo:** Tipos de cliente + validación Sisbén + carga masiva  
**Archivo:** `apps/api/src/modules/clientes/tipos-cliente.service.ts`  
**Estado:** 🔲 Pendiente (Q2)  
**Endpoints:**
- `GET /v1/tipos-cliente`
- `POST /v1/tipos-cliente`
- `POST /v1/clientes/importar` — CSV masivo
- Validación: Sisbén máx 7 envíos/año, verificar `envios_sisben_ano`

**Pregunta abierta:** ¿Existe API pública para validar nivel Sisbén por cédula?

---

### #POC-INV-001
**Módulo:** Stock en tiempo real (solo informativo, no bloquea ventas)  
**Archivo:** `apps/api/src/modules/inventario/inventario.service.ts`  
**Estado:** 🔲 Pendiente (Q2)  
**Endpoints:**
- `GET /v1/inventario/sucursal/:id` — stock actual por sucursal

---

### #POC-INV-002
**Módulo:** Órdenes de reposición de almacén  
**Archivo:** `apps/api/src/modules/inventario/ordenes.service.ts`  
**Estado:** 🔲 Pendiente (Q2)  
**Endpoints:**
- `POST /v1/ordenes-inventario` — crear solicitud
- `PUT /v1/ordenes-inventario/:id/confirmar` — aprobar/rechazar

---

### #POC-INV-003
**Módulo:** Alertas de stock mínimo  
**Archivo:** `apps/api/src/modules/inventario/alertas.service.ts`  
**Estado:** 🔲 Pendiente (Q7)  
**Endpoints:**
- `GET /v1/inventario/alertas/critico` — usa view `v_kpi_inventario_critico`

---

### #POC-ENV-001
**Módulo:** Cotizador de envíos + peso volumétrico  
**Archivo:** `apps/api/src/modules/envios/cotizador.service.ts`  
**Estado:** 🔲 Pendiente (Q5)  
**Endpoint:** `POST /v1/envios/cotizar`  
**Fórmula:** `peso_vol = (alto × ancho × largo) / factor_volumetrico`  
`peso_tarificado = MAX(peso_fisico, peso_vol)`  
Factor configurable por servicio (default 2500).

---

### #POC-ENV-002
**Módulo:** Facturación de guía de envío  
**Archivo:** `apps/api/src/modules/envios/envios.service.ts`  
**Estado:** 🔲 Pendiente (Q5)  
**Endpoints:**
- `POST /v1/envios` — crea guía, registra movimiento_caja
- `GET /v1/envios/:id`

**Pregunta abierta:** ¿Sigma valida ruta antes de facturar? (`/api/validate-route`)

---

### #POC-ENV-003
**Módulo:** Báscula USB/Serial (adaptador de hardware)  
**Archivo:** `apps/api/src/integrations/bascula/bascula.adapter.ts`  
**Estado:** 🔲 Pendiente (Q5)  
**Endpoint:** `GET /v1/hardware/bascula/peso` — lectura en tiempo real  
Mock en desarrollo, hardware real en producción.

---

### #POC-ENV-004
**Módulo:** Cálculo de estampillas SPU (algoritmo)  
**Archivo:** `apps/api/src/modules/envios/estampillas.service.ts`  
**Estado:** 🔲 Pendiente (Q2)  
**Endpoint:** `POST /v1/envios/calcular-estampillas`  
Aplica a: correo nacional certificado/express. Descuento a clientes TPR.

---

### #POC-INTL-001
**Módulo:** Envío internacional MS/UPU con guía física pre-impresa  
**Archivo:** `apps/api/src/modules/internacionales/ms.service.ts`  
**Estado:** 🔲 Pendiente (Q6)  
**Endpoint:** `POST /v1/envios/internacional/ms`

---

### #POC-INTL-002
**Módulo:** Generación de documentos para envíos internacionales  
**Archivo:** `apps/api/src/modules/internacionales/documentos.service.ts`  
**Estado:** 🔲 Pendiente (Q7)  
**Endpoint:** `POST /v1/envios/:id/generar-documentos`  
Genera: CN22, CN23, CP72, declaración de aduanas.

**Pregunta abierta:** ¿Sigma devuelve PDF como Base64 o URL?

---

### #POC-INTL-003
**Módulo:** Registro en Sigma API (doble registro obligatorio)  
**Archivo:** `apps/api/src/integrations/sigma/sigma.client.ts`  
**Estado:** 🔲 Pendiente (Q6)  
**Endpoint:** `POST /v1/sigma/registrar-paquete` (async vía RabbitMQ)  
Sigma API: `POST /api/registerPackage` — requiere confirmar endpoint exacto.

---

### #POC-CAJA-001
**Módulo:** Apertura y cierre de caja  
**Archivo:** `apps/api/src/modules/caja/caja.service.ts`  
**Estado:** 🔲 Pendiente (Q4)  
**Endpoints:**
- `POST /v1/cajas/:id/abrir` — crea sesion_caja, registra movimiento apertura
- `POST /v1/cajas/:id/cerrar` — registra cierre, calcula diferencias

**Regla:** Cierre automático a las 10PM (cron NestJS → `cierre_forzado = true`).

---

### #POC-CAJA-002
**Módulo:** Consignaciones bancarias y alertas de aprobación  
**Archivo:** `apps/api/src/modules/caja/consignaciones.service.ts`  
**Estado:** 🔲 Pendiente (Q4)  
**Endpoints:**
- `POST /v1/consignaciones`
- `PUT /v1/consignaciones/:id/aprobar`

---

### #POC-CAJA-003
**Módulo:** Reposición entre cajas  
**Archivo:** `apps/api/src/modules/caja/reposiciones.service.ts`  
**Estado:** 🔲 Pendiente (Q7)  
**Endpoints:**
- `POST /v1/cajas/reposicion`
- `PUT /v1/reposiciones/:id/aprobar`

---

### #POC-CAJA-004
**Módulo:** Diferencias faltante/sobrante  
**Archivo:** `apps/api/src/modules/caja/diferencias.service.ts`  
**Estado:** 🔲 Pendiente (Q4)  
**Endpoint:** `POST /v1/cajas/diferencia`  
Genera alerta automática al administrativo.

---

### #POC-ALERT-001
**Módulo:** Motor de alertas del sistema  
**Archivo:** `apps/api/src/modules/alertas/alertas.service.ts`  
**Estado:** 🔲 Pendiente (Q4)  
**Endpoint:** `GET /v1/alertas?sucursal=&tipo=&estado=`  
Tipos: `consignacion_pendiente | anulacion_solicitada | diferencia_faltante | ...`

---

### #POC-APT-001
**Módulo:** Venta y renovación de apartados postales  
**Archivo:** `apps/api/src/modules/apartados/apartados.service.ts`  
**Estado:** 🔲 Pendiente (Q5)  
**Endpoints:**
- `GET /v1/apartados/sucursal/:id` — disponibles
- `POST /v1/apartados/vender`

---

### #POC-APT-002
**Módulo:** Alertas de vencimiento de apartados  
**Archivo:** `apps/api/src/modules/apartados/alertas.service.ts`  
**Estado:** 🔲 Pendiente (Q5)  
**Endpoint:** `GET /v1/apartados/por-vencer` — cron diario 8AM  
Usa view: `v_kpi_apartados_vencer`

---

### #POC-FACT-001
**Módulo:** Recibo de venta (impresora EPSON TM-T88V)  
**Archivo:** `apps/api/src/modules/facturacion/recibo.service.ts`  
**Estado:** 🔲 Pendiente (Q6)  
**Endpoints:**
- `POST /v1/facturas/recibo`
- `GET /v1/facturas/:id/pdf`

---

### #POC-FACT-002
**Módulo:** Factura electrónica DIAN vía RabbitMQ → Delcop Titanio  
**Archivo:** `apps/api/src/queue/dian.producer.ts`  
**Estado:** 🔲 Pendiente (Q6)  
**Queue:** `dian.invoice.create` (RabbitMQ exchange `pos.dian`)

---

### #POC-DESP-001
**Módulo:** Creación de sacas para despacho  
**Archivo:** `apps/api/src/modules/despacho/sacas.service.ts`  
**Estado:** 🔲 Pendiente (Q7)  
**Endpoints:**
- `POST /v1/sacas`
- `GET /v1/sacas/abiertas/:sucursalId`

**Plataforma actual:** C-POS (no confundir con CIPOS).  
**Ruta de menú actual:** Operación → Tratamiento → Confección de pieza postal.  
**Centro operativo destino:**
- Nacional: Centro A (ej: Bogotá)
- Internacional: C432 / UPX

**Tipo saca:** `consolidada` por defecto (permite mezclar certificados, express, etc.).  
**Precinto:** Número de precinto físico → se ingresa al crear la saca.  
**Múltiples sacas:** Se pueden tener varias abiertas simultáneamente (distintos precintos).  
**Sesión persistente:** La ventana puede minimizarse; al volver, la saca abierta sigue disponible.  
**Precintos:** No inventariados en sistema actual; se solicitan por formato de papelería periódico.

---

### #POC-DESP-002
**Módulo:** Ingreso de envíos a saca (scan de código de barras)  
**Archivo:** `apps/api/src/modules/despacho/sacas.service.ts`  
**Estado:** 🔲 Pendiente (Q7)  
**Endpoint:** `POST /v1/sacas/:id/envios`

**Validación de duplicados:** Si se intenta ingresar una guía que ya está en la saca → sistema emite alerta "el envío ya está incluido en la saca".  
**Horario crítico:** Todo envío debe estar en saca antes de las **17:30** (hora de recogida del transporte).  
**Alerta sugerida:** A las 17:00 → notificar si hay envíos del día sin despachar.

---

### #POC-DESP-003
**Módulo:** Cierre de saca + generación de manifiesto  
**Archivo:** `apps/api/src/modules/despacho/sacas.service.ts`  
**Estado:** 🔲 Pendiente (Q7)  
**Endpoints:**
- `POST /v1/sacas/:id/cerrar`
- `GET /v1/sacas/:id/manifiesto`
- `POST /v1/sacas/:id/reimprimir-marbete`
- `POST /v1/sacas/:id/reimprimir-relacion`

**Flujo de cierre (confirmado en transcripción FASE 2):**
1. Cajero registra peso de la saca (báscula externa; no se registra por envío sino al cierre)
2. Sistema genera: **manifiesto de despacho** (listado de envíos) + **marbete** (etiqueta con código de barras)
3. Transportista llega, puntea las sacas por cantidad/peso → **NO puede abrir el contenido**
4. Transportista firma el manifiesto; la apertura real ocurre en el **centro de instrucción destino**

**Manejo de envío que no salió:**
- Cajero informa a Novedades/Paquetería por correo
- Opciones: (a) **Cambio de custodia** si el sistema lo permite, (b) **manifiesto manual** adjunto a la siguiente saca que indique la saca original

**Problema conocido en C-POS actual:** Bloqueos al imprimir marbete/relación → se resuelve desde Reimpresión de Formatos en el mismo menú.

**Restricción del transportista:** El contrato no les permite abrir las sacas. Solo firman de recibido por número de sacas. El conteo exacto de guías lo hace el centro operativo destino.

---

### #POC-GIRO-001
**Módulo:** Giro nacional — emisión  
**Archivo:** `apps/api/src/modules/giros/nacionales.service.ts`  
**Estado:** 🔲 Pendiente (Q8)  
**Endpoint:** `POST /v1/giros/nacional/emitir`

**Flujo (confirmado en transcripción FASE 2):**
1. Cajero ingresa monto_cop + define si flete ($4.700) lo asume remitente o beneficiario
2. Sistema consulta Inspektor (SAGRILAFT/listas internas 4-72) → continúa si `limpio`
3. Ingresa cédula del remitente → si ya existe en sistema, autocompleta datos
4. **Captura huella dactilar del remitente** (sistema biométrico vinculado a "hereditar")
5. Ingresa datos del beneficiario + sucursal destino
6. Sistema genera PIN único (visible en factura)
7. Cajero imprime Formulario 5 + declaración de origen de fondos → cliente firma + huella en todas las hojas
8. Cajero registra `formulario_5=true`, `declaracion_origen=true`, `fotocopia_cedula=true`

**Restricción crítica:** Solo se puede pagar en puntos propios de 4-72 y oficinas principales. **No aplica en aliados ni expendios.**  
**Listas restrictivas:** Automáticas (Inspektor) antes de aprobar.

---

### #POC-GIRO-002
**Módulo:** Giro nacional — pago  
**Archivo:** `apps/api/src/modules/giros/nacionales.service.ts`  
**Estado:** 🔲 Pendiente (Q8)  
**Endpoint:** `POST /v1/giros/nacional/pagar`

**Flujo (confirmado en transcripción FASE 2):**
1. Cajero ingresa PIN del cliente
2. Sistema muestra datos del giro (remitente, monto, destinatario)
3. Cajero valida identidad del beneficiario (cédula física vs datos en sistema)
4. Actualiza giro a estado `pagado`, crea `movimiento_caja` tipo `giro_pago`
5. Factura de pago: nombre cajero, persona a quien se entregó, cédula, valor pagado
6. Cliente firma y coloca huella (soporte para auditorías)

---

### #POC-GIRO-003
**Módulo:** MoneyGram — emisión y pago  
**Archivo:** `apps/api/src/integrations/moneygram/moneygram.client.ts`  
**Estado:** 🔲 Pendiente (Q9)  
**Endpoints:**
- `POST /v1/giros/moneygram/emitir`
- `POST /v1/giros/moneygram/pagar`

**Cobertura:** Todo el mundo (muchos países y monedas).  
**Listas restrictivas:** MoneyGram maneja sus propias listas, **integradas automáticamente** en su API — no se llama a Inspektor por separado.

**Flujo emisión (confirmado en transcripción FASE 2):**
1. Cajero selecciona país destino + ingresa monto COP
2. Sistema muestra: monto en moneda destino (ej: 500k COP → 137 USD), comisión/flete (ej: $15k)
3. Ingresa datos remitente (cédula/pasaporte, nombre, dirección, código postal, teléfono, email para factura)
4. Si cliente ya existe → autocompleta; solo confirma cambios de contacto
5. Ingresa datos destinatario (tipo documento, nombre, fecha nacimiento, ciudad/estado en país destino)
6. Sistema procesa → genera PIN de **6 dígitos**
7. Documentos obligatorios: Formulario 5 (impreso automático), Declaración de origen de fondos, fotocopia cédula
8. Todo va con firma y huella en todas las hojas

**Flujo pago (confirmado en transcripción FASE 2):**
1. Cajero ingresa PIN (6 dígitos)
2. Sistema muestra datos (los registrados en el país de origen)
3. Validación crítica: **nombre debe coincidir EXACTAMENTE** con cédula (dos nombres = dos nombres, dos apellidos = dos apellidos). Si no coincide → no se puede pagar
4. Cajero ingresa: cédula, fecha nacimiento, dirección, teléfono del beneficiario
5. Sistema genera formulario que el cliente firma
6. Mismos documentos obligatorios que en emisión

**Pregunta abierta:** Requiere documentación REST API MoneyGram (no DLL legacy).

---

### #POC-GIRO-004
**Módulo:** RIA — pago con PIN 11 dígitos  
**Archivo:** `apps/api/src/integrations/ria/ria.client.ts`  
**Estado:** 🔲 Pendiente (Q9)  
**Endpoint:** `POST /v1/giros/ria/pagar`

**Solo pago (NO emisión).** RIA v1.6 API.  
**Listas restrictivas:** Automáticas.

**Flujo pago (confirmado en transcripción FASE 2):**
1. Cajero ingresa PIN de **11 dígitos**
2. Sistema muestra: cajero, tipo de pago, referencia, nombre beneficiario, cédula, valor
3. Validación de identidad del beneficiario
4. Documentos obligatorios: Formulario 5, Declaración de origen de fondos, firma y huella

**Ventaja operativa:** Más rápido que MoneyGram — el PIN devuelve directamente los datos en pantalla sin navegar múltiples páginas intermedias.

---

### #POC-GIRO-005
**Módulo:** IFS — emisión y pago (interfaz web propia)  
**Archivo:** `apps/api/src/integrations/ifs/ifs.client.ts`  
**Estado:** 🔲 Pendiente (Q9)  
**Endpoints:**
- `POST /v1/giros/ifs/emitir`
- `POST /v1/giros/ifs/pagar`

**Países habilitados (6):** Chile, España, Perú, Uruguay, Cuba. República Dominicana ya **no está activo**.  
**Emite Y paga.**

**Acceso actual:** IFS tiene su propia plataforma web con usuario y clave propios (distinto de las credenciales de 4-72).  

**Listas restrictivas: MANUAL** — el cajero debe consultar manualmente la lista usando usuario y contraseña separados ("guías de Fiat-Tandra"). No está integrado con Inspektor ni con el sistema automático.

**Flujo operativo (transcripción FASE 2):**
1. Cajero ingresa a sistema IFS con credenciales propias
2. Sistema muestra: flujos salientes (emisión), flujos entrantes (pagos pendientes por cobrar)
3. Para pago: código alfanumérico + código secreto del beneficiario
4. Consulta manual de listas restrictivas (Fiat-Tandra) con usuario/clave separados
5. Documentos: Formulario 5, firma, huella

**Estrategia de integración:** Pendiente confirmar si IFS expone API REST o solo interfaz web (Puppeteer scraping como fallback).  
**Pregunta abierta:** ¿IFS ofrece API REST o SFTP para integración? ¿Cómo se integraría la consulta de listas Fiat-Tandra?

---

### #POC-GIRO-006
**Módulo:** Inspektor — listas restrictivas SAGRILAFT/LAFT/OFAC  
**Archivo:** `apps/api/src/integrations/inspektor/inspektor.client.ts`  
**Estado:** 🔲 Pendiente (Q8)  
**Endpoint:** `POST /v1/cumplimiento/consultar`  
Resultados: `limpio | alerta | bloqueado`. Se ejecuta ANTES de aprobar cualquier giro.

**Aplicación por tipo de giro (confirmado en transcripción FASE 2):**
| Tipo giro | Listas restrictivas | Modo |
|-----------|-------------------|------|
| Nacional | Inspektor (listas internas 4-72: SAGRILAFT, lavado activos, terrorismo) | **Automático** |
| MoneyGram | Listas propias MoneyGram | **Automático** (integrado en su API) |
| RIA | Inspektor | **Automático** |
| IFS | Fiat-Tandra (lista externa) | **Manual** (usuario/clave separados) |
| CFS | Sin integración actual | **No integrado** |

**Comportamiento ante alerta:** No bloquea automáticamente — el cajero debe validar con el cliente y escalar si hay novedad. El resultado queda registrado en `giros.resultado_inspektor`.

---

### #POC-GIRO-007
**Módulo:** Giros CFS — emisión y pago vía FortiClient/VPN  
**Archivo:** `apps/api/src/integrations/cfs/cfs.client.ts`  
**Estado:** 🔲 Pendiente (Q9) — **Plataforma nueva, no documentada antes**  
**Endpoints:**
- `POST /v1/giros/cfs/emitir`
- `POST /v1/giros/cfs/pagar`

**Descripción:** Giros CFS es una plataforma de giros internacionales **completamente separada** de MoneyGram, RIA e IFS. Actualmente los cajeros acceden a ella por FortiClient (VPN corporativa) e ingresan a su propia interfaz web.

**Características (confirmado en transcripción FASE 2):**
- Emite Y paga giros internacionales
- Código alfanumérico + código secreto (similar a IFS)
- **No integrado con listas restrictivas** de 4-72 actualmente
- **Su saldo SÍ afecta la caja**, pero con sincronización **cada hora** (no en tiempo real)
- Los cajeros actualmente hacen un "log" a la plataforma CFS y el descuento en caja ocurre ~1 hora después

**Impacto en caja actual:** El saldo de caja NO es exacto durante el día para las transacciones CFS. Genera riesgo de descuadre en cierre.

**Integración requerida en nuevo sistema:**
- Eliminar el paso de FortiClient/VPN para el cajero
- Integrar directamente por API (pendiente confirmar si CFS expone API)
- Cada transacción CFS debe generar `movimiento_caja` inmediatamente
- Integrar con listas restrictivas de 4-72

**Pregunta abierta:** ¿CFS expone API REST? ¿Cuáles son las credenciales/contratos de integración? Bloquea #POC-GIRO-007.

---

### #POC-REC-001
**Módulo:** Recaudos por convenio (servicios públicos y otros)  
**Archivo:** `apps/api/src/modules/recaudos/recaudos.service.ts`  
**Estado:** 🔲 Pendiente (Q10)  
**Endpoints:**
- `GET /v1/convenios`
- `POST /v1/recaudos`

**Parametrizable por sucursal:** No todos los puntos pueden recibir todos los convenios. La habilitación se configura en `convenios_sucursal`. El objetivo del nuevo sistema es que cualquier tipo de negocio (recaudo) pueda "pegarse" a la plataforma sin necesidad de cambiar el sistema base.

**Convenios activos/históricos (confirmado en transcripción FASE 2):**
| Convenio | Estado | Notas |
|----------|--------|-------|
| DIAL | Activo (solo 2 puntos) | Recaudo activo en producción actualmente |
| Registraduría | Históricamente activo | No activo actualmente |
| SOAT | Históricamente activo | No activo actualmente |
| Evolución de encomiendas internacionales | Activo | |
| Corresponsales bancarios | En reactivación | Cuando operen como corresponsal bancario |
| EPM, ETB, Codensa, Claro, Movistar, Tigo, Acueducto, TransMilenio | En seeds demo | Pendiente activación real |

---

### #POC-KPI-001 — #POC-KPI-008
**Módulo:** Dashboard KPIs  
**Archivo:** `apps/api/src/modules/kpis/kpis.service.ts`  
**Estado:** 🔲 Pendiente (Q11)  
**Vistas SQL:** `v_kpi_caja_estado`, `v_kpi_ventas_dia`, `v_kpi_giros_dia`, `v_kpi_diferencias_mes`, `v_kpi_inventario_critico`, `v_kpi_apartados_vencer`, `v_kpi_ranking_sucursales`, `v_kpi_anulaciones`

| Bookmark | Endpoint | Vista |
|----------|----------|-------|
| #POC-KPI-001 | GET /v1/kpis/cajas/estado | v_kpi_caja_estado |
| #POC-KPI-002 | GET /v1/kpis/ventas/dia | v_kpi_ventas_dia |
| #POC-KPI-003 | GET /v1/kpis/giros/dia | v_kpi_giros_dia |
| #POC-KPI-004 | GET /v1/kpis/diferencias?desde=&hasta= | v_kpi_diferencias_mes |
| #POC-KPI-005 | GET /v1/kpis/inventario/critico | v_kpi_inventario_critico |
| #POC-KPI-006 | GET /v1/kpis/apartados/por-vencer | v_kpi_apartados_vencer |
| #POC-KPI-007 | GET /v1/kpis/ranking/sucursales?fecha= | v_kpi_ranking_sucursales |
| #POC-KPI-008 | GET /v1/kpis/anulaciones?desde=&hasta= | v_kpi_anulaciones |

---

## Preguntas abiertas (bloquean implementación)

| # | Pregunta | Bloquea |
|---|----------|---------|
| 1 | Endpoint exacto Sigma para validar ruta (`/api/validate-route`?) | #POC-ENV-002 |
| 2 | Sigma devuelve guía en Base64 o URL PDF? | #POC-ENV-002, #POC-INTL-001 |
| 3 | Tarifas vienen de `/api/tariff-module/route-array/coverage`? | #POC-ENV-001 |
| 4 | ¿Qué es la API "GFFP"? | desconocido |
| 5 | ¿IFS expone API REST o SFTP para integración? ¿Cómo integrar listas Fiat-Tandra? | #POC-GIRO-005 |
| 6 | Documentación técnica REST MoneyGram (sin DLL legacy) | #POC-GIRO-003 |
| 7 | ¿Descuento Sisbén aplica a giros también? | #POC-CLI-002 |
| 8 | API para consultar nivel Sisbén por cédula | #POC-CLI-002 |
| 9 | ¿Cómo reportar pagos con estampillas (preporteado) al ERP? | #POC-FACT-002 |
| 10 | ¿Cierre automático 10PM interrumpe sesiones activas? | #POC-CAJA-001 |
| 11 | ¿CFS expone API REST o solo interfaz web? ¿Credenciales/contrato de integración? | #POC-GIRO-007 |
| 12 | ¿Qué sistema biométrico usa 4-72 para captura de huella en giros nacionales ("hereditar")? | #POC-GIRO-001 |
| 13 | ¿Los corresponsales bancarios usan la misma tabla de convenios_recaudo o requieren módulo separado? | #POC-REC-001 |
