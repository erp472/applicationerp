# Preguntas Críticas para Reunión con el Jefe / Cliente
## Sistema POS 4-72 — Antes de continuar el desarrollo

> **Objetivo:** Esta lista agrupa todas las preguntas que bloquean decisiones de implementación o que, si se responden mal, obligarían a reescribir módulos completos. Ordenadas por impacto.

---

## 🔴 BLOQUEA CÓDIGO — No podemos avanzar sin esto

### 1. MoneyGram: ¿Tienen documentación REST API?

**Contexto:** El sistema actual (MultiPay) usa una DLL de Windows para conectarse a MoneyGram. En el nuevo sistema (Tauri + NestJS) eso no funciona porque la DLL es legacy y no expone HTTP.

**Pregunta exacta:**
> ¿4-72 tiene contrato con MoneyGram que incluya acceso a su REST API? ¿Hay un portal de desarrolladores, credenciales sandbox o contacto técnico de MoneyGram Colombia?

**Impacto si no se resuelve:** No podemos implementar #POC-GIRO-003 (MoneyGram) en ninguna de sus fases. El módulo de giros internacionales quedaría incompleto.

---

### 2. CFS: ¿Existe API o solo interfaz web?

**Contexto:** CFS (Giros internacionales vía FortiClient/VPN) es una plataforma completamente separada. Actualmente los cajeros entran manualmente por VPN y los descuentos en caja ocurren ~1 hora después, lo que causa descuadres.

**Pregunta exacta:**
> ¿CFS (la plataforma de giros por FortiClient) tiene API REST o algún mecanismo de integración programática? ¿Quién es el contacto técnico en CFS? ¿4-72 tiene contrato de integración con ellos?

**Impacto si no se resuelve:** CFS no puede integrarse en tiempo real. La caja seguirá desajustada durante el día (#POC-GIRO-007). Tendríamos que mantener la operación manual o hacer screen-scraping (frágil, no recomendado).

---

### 3. IFS: ¿Tienen API o solo panel web?

**Contexto:** IFS maneja 6 países. Actualmente se accede por una interfaz web propia con usuario y clave separados de 4-72. Las listas restrictivas (Fiat-Tandra) se consultan manualmente.

**Pregunta exacta:**
> ¿IFS tiene API REST o SFTP para integrar emisión y pago de giros desde nuestro sistema? ¿Fiat-Tandra tiene API o solo se consulta manualmente en su web?

**Impacto si no se resuelve:** IFS requeriría web scraping con Puppeteer (mantenimiento alto, se rompe con cada actualización de su interfaz). #POC-GIRO-005 quedaría en modo degradado.

---

### 4. Sistema biométrico "Hereditar": ¿Qué SDK usa?

**Contexto:** Para giros nacionales, el sistema actual captura huella dactilar del remitente vinculada al sistema llamado "Hereditar". Esto es un requisito regulatorio (SAGRILAFT/prevención fraude).

**Pregunta exacta:**
> ¿Qué hardware de huella digital usa 4-72? ¿El SDK de "Hereditar" tiene documentación técnica? ¿Tiene driver para Windows/Linux? ¿Hay un proveedor de contacto?

**Impacto si no se resuelve:** No podemos implementar la captura biométrica en el módulo de giros nacionales (#POC-GIRO-001). Si es requisito legal, el módulo queda incompleto para producción.

---

### 5. Sigma API: Endpoints exactos

**Contexto:** El sistema debe registrar cada envío en Sigma (plataforma de seguimiento). Tenemos referencias parciales como `/api/registerPackage` pero necesitamos confirmar los endpoints de tarifas y validación de ruta.

**Preguntas exactas:**
> a) ¿El endpoint de tarifas es `/api/tariff-module/route-array/coverage`?
> b) ¿El endpoint de validación de ruta es `/api/validate-route`?
> c) ¿Sigma devuelve la guía generada como PDF en Base64 o como URL descargable?
> d) ¿Hay documentación técnica de Sigma API o un contacto técnico?

**Impacto si no se resuelve:** Bloquea #POC-ENV-001 (cotizador), #POC-ENV-002 (facturación), #POC-INTL-001 (envíos internacionales MS). Sin esto no podemos integrar el 60% del módulo de envíos.

---

## 🟠 REGULATORIO — Error aquí tiene consecuencias legales

### 6. UIAF vs MinTIC: ¿A quién reportamos los giros?

**Contexto:** En el documento del plan se menciona reporte a "MinTIC" para giros. MinTIC es el Ministerio de TIC (telecomunicaciones) y NO recibe reportes de operaciones financieras. La entidad correcta para reportes SAGRILAFT/SARLAFT de giros es la **UIAF** (Unidad de Información y Análisis Financiero) o el mismo proveedor (MoneyGram/RIA/IFS ya lo hace por su cuenta).

**Pregunta exacta:**
> ¿A qué entidad reporta 4-72 las operaciones de giros? ¿Es la UIAF directamente, o los proveedores (MoneyGram, RIA, IFS, CFS) lo hacen por cuenta propia? ¿En qué periodicidad y formato?

**Impacto si no se resuelve:** El campo `reportado_mintic` en la base de datos puede estar mal nombrado y apuntar a un proceso incorrecto. Si el reporte a UIAF es responsabilidad directa de 4-72, necesitamos un módulo de reportería que actualmente no está planificado.

---

### 7. DIAN: ¿Cuándo entra en producción la facturación electrónica?

**Contexto:** El módulo de facturación electrónica a DIAN (vía Delcop Titanio + RabbitMQ) está planificado para Q6. Necesitamos saber si hay una fecha límite regulatoria que fuerce su implementación antes.

**Pregunta exacta:**
> ¿Hay resolución DIAN que obligue a 4-72 a facturar electrónicamente en una fecha específica? ¿Delcop Titanio ya está contratado? ¿Tienen ambiente de pruebas disponible?

**Impacto si no se resuelve:** Si la fecha regulatoria es antes de Q6, el cronograma debe reordenarse completamente. Si Delcop no está contratado, no podemos usar el módulo de facturación electrónica.

---

### 8. Listas restrictivas: ¿CFS tiene obligación de consultar Inspektor/SAGRILAFT?

**Contexto:** Para giros nacionales, MoneyGram (listas propias automáticas) e IFS (Fiat-Tandra manual) tienen su proceso de listas. CFS actualmente no tiene ninguna integración con listas restrictivas.

**Pregunta exacta:**
> Para giros CFS, ¿4-72 está obligado a consultar Inspektor o alguna lista SAGRILAFT/OFAC antes de aprobar? ¿O CFS asume esa responsabilidad por su cuenta?

**Impacto si no se resuelve:** Si 4-72 debe consultar Inspektor para CFS, el flujo de CFS es más complejo de lo documentado y requiere integración con el módulo de cumplimiento.

---

## 🟡 REGLAS DE NEGOCIO — Cambia la lógica del sistema

### 9. Sisbén: ¿Aplica solo a envíos postales o también a giros?

**Contexto:** El descuento Sisbén (tarifa postal reducida) está documentado para envíos. No está claro si aplica también a giros nacionales o a otros servicios.

**Pregunta exacta:**
> El beneficio Sisbén de máximo 7 envíos/año, ¿aplica únicamente a paquetes/correspondencia o también a giros de dinero y otros servicios?

**Impacto si no se resuelve:** Si aplica a giros, el contador `envios_sisben_ano` debe renombrarse y la lógica de validación debe cubrir módulos adicionales (#POC-CLI-002, #POC-GIRO-001).

---

### 10. Sisbén: ¿Existe API para validar nivel por cédula?

**Contexto:** Actualmente el cajero selecciona el nivel Sisbén del cliente manualmente. Esto es propenso a errores o fraude.

**Pregunta exacta:**
> ¿Existe alguna API pública o convenio con el DNP/MinSalud para consultar automáticamente el nivel Sisbén de un cliente por cédula? ¿O siempre lo captura el cajero manualmente?

**Impacto si no se resuelve:** Si no hay API, necesitamos implementar validación manual con mecanismos antifraude (auditoría, límite de uso, etc.). Si hay API, hay que integrarla en el flujo de clientes.

---

### 11. Cierre automático 10PM: ¿Qué pasa si hay una transacción en curso?

**Contexto:** El sistema debe cerrar todas las sesiones de caja automáticamente a las 10PM con `cierre_forzado = true`. No está definido qué pasa si en ese momento hay un cajero en medio de un envío o giro.

**Pregunta exacta:**
> Si el cajero está facturando una guía o procesando un giro exactamente a las 10PM cuando el sistema cierra cajas, ¿qué debe pasar? ¿Se permite terminar la transacción en curso? ¿Se cancela? ¿Se da un plazo de gracia de X minutos?

**Impacto si no se resuelve:** No podemos implementar el cron de cierre automático (#POC-CAJA-001) sin esta regla. Una decisión incorrecta puede generar transacciones huérfanas o pérdidas de datos.

---

### 12. Estampillas y ERP: ¿Cómo se reporta el preporteado?

**Contexto:** Cuando un cliente paga con estampillas (preporteado/mixto_preporteado), hay un flujo especial hacia el ERP. No está documentado cómo el ERP espera recibir esta información.

**Pregunta exacta:**
> ¿Cómo se reporta al ERP un pago con estampillas (preporteado)? ¿Es una entrada en RabbitMQ igual a las facturas DIAN, o tiene su propio canal/formato? ¿El ERP es el mismo sistema para todas las regionales?

**Impacto si no se resuelve:** El módulo de facturación (#POC-FACT-002) y el consumer de ERP (`erp.consumer.ts`) no pueden completarse sin esta definición.

---

### 13. Giros nacionales: ¿Solo se emiten y pagan en puntos 4-72?

**Contexto:** Según el análisis, para giros nacionales el pago debe hacerse en un punto 4-72. Sin embargo, no está confirmado si un giro emitido en Bogotá puede pagarse en cualquier punto 4-72 del país o solo en la misma regional.

**Pregunta exacta:**
> Para giros nacionales, ¿el beneficiario puede cobrar en cualquier sucursal 4-72 del país, o hay restricciones por regional? ¿Hay restricción de que tanto emisión como pago deben hacerse en puntos 4-72 (no en aliados ni expendios)?

**Impacto si no se resuelve:** La lógica de validación de destino en #POC-GIRO-001 y #POC-GIRO-002 cambia completamente según la respuesta.

---

### 14. IFS: ¿Cubre República Dominicana?

**Contexto:** En la transcripción de FASE 2 se mencionó IFS para 6 países pero quedó sin confirmar si República Dominicana está incluida.

**Pregunta exacta:**
> ¿IFS cubre envíos a República Dominicana? ¿Cuáles son los 6 países exactos que cubre IFS actualmente?

**Impacto si no se resuelve:** El catálogo de destinos de IFS (#POC-GIRO-005) queda incompleto y podría mostrar opciones incorrectas al cajero.

---

### 15. Corresponsales bancarios: ¿Módulo separado o parte de recaudos?

**Contexto:** Algunas sucursales están en proceso de reactivación como corresponsales bancarios. No está definido si esta funcionalidad usa la misma tabla de convenios de recaudo o requiere módulo propio.

**Pregunta exacta:**
> ¿El módulo de corresponsales bancarios (retiros, depósitos, pagos) usa la misma lógica de recaudos por convenio, o tiene flujos y reportes propios? ¿Cuándo se activará en las sucursales?

**Impacto si no se resuelve:** Si son módulos diferentes, necesitamos planificar #POC-REC-002 (corresponsales) como un POC adicional no contemplado en el cronograma actual.

---

## 🔵 ARQUITECTURA — Afecta decisiones técnicas de infraestructura

### 16. API "GFFP": ¿Qué es?

**Contexto:** En el documento oficial del plan aparece una referencia a una API llamada "GFFP" sin documentación ni descripción adicional.

**Pregunta exacta:**
> ¿Qué es la API "GFFP" mencionada en el plan de desarrollo? ¿Es un sistema interno de 4-72, un proveedor externo o una sigla de otra plataforma?

**Impacto si no se resuelve:** Si es un requisito real, falta al menos un módulo de integración completo en el sistema.

---

### 17. CFS Cash Sync: ¿Podemos reducir la ventana de 1 hora?

**Contexto:** CFS sincroniza el saldo de caja cada hora (no en tiempo real). Esto genera riesgo de descuadre durante el día y complica los KPIs de caja en tiempo real.

**Pregunta exacta:**
> ¿Hay negociación posible con CFS para que notifiquen las transacciones en tiempo real (webhook, polling más frecuente)? ¿O hay alguna forma de acceder al balance actualizado desde su plataforma?

**Impacto si no se resuelve:** Los KPIs de estado de caja (#POC-KPI-001) mostrarán saldos incorrectos para sucursales con operaciones CFS durante el día. Hay que documentarlo claramente como limitación conocida.

---

### 18. Volumen de transacciones: ¿Cuántas por día por sucursal?

**Contexto:** No tenemos datos concretos de volumen transaccional de las 65 sucursales actuales para dimensionar correctamente la base de datos y la infraestructura.

**Pregunta exacta:**
> ¿Cuántas transacciones promedio diarias maneja una sucursal tipo? ¿Y las más grandes (Bogotá centro, Medellín)? ¿Tienen exports de MultiPay con históricos de volumen?

**Impacto si no se resuelve:** Podríamos subdimensionar PostgreSQL o Redis. Los índices y la estrategia de particionamiento de tablas grandes (`envios`, `movimientos_caja`) dependen de este dato.

---

## Resumen Ejecutivo por Categoría

| Prioridad | # | Pregunta | Bloquea |
|-----------|---|----------|---------|
| 🔴 | 1 | MoneyGram: ¿REST API disponible? | #POC-GIRO-003 |
| 🔴 | 2 | CFS: ¿API REST o solo web? | #POC-GIRO-007 |
| 🔴 | 3 | IFS: ¿API REST o solo web? | #POC-GIRO-005 |
| 🔴 | 4 | Hereditar: ¿Qué SDK biométrico? | #POC-GIRO-001 |
| 🔴 | 5 | Sigma: endpoints exactos + formato respuesta | #POC-ENV-001, #POC-ENV-002 |
| 🟠 | 6 | ¿UIAF o MinTIC recibe reportes de giros? | #POC-FACT-002, base de datos |
| 🟠 | 7 | DIAN: ¿Fecha límite regulatoria? ¿Delcop contratado? | #POC-FACT-002 |
| 🟠 | 8 | CFS: ¿Obligación de consultar Inspektor/SAGRILAFT? | #POC-GIRO-007 |
| 🟡 | 9 | Sisbén: ¿Aplica a giros también? | #POC-CLI-002 |
| 🟡 | 10 | Sisbén: ¿API pública por cédula? | #POC-CLI-002 |
| 🟡 | 11 | Cierre 10PM: ¿Transacciones en curso? | #POC-CAJA-001 |
| 🟡 | 12 | Preporteado: ¿Cómo se reporta al ERP? | #POC-FACT-002 |
| 🟡 | 13 | Giros nacionales: ¿Solo puntos 4-72? | #POC-GIRO-001, #POC-GIRO-002 |
| 🟡 | 14 | IFS: ¿Cubre Rep. Dominicana? ¿Cuáles 6 países? | #POC-GIRO-005 |
| 🟡 | 15 | Corresponsales: ¿Módulo separado o parte de recaudos? | #POC-REC-001 |
| 🔵 | 16 | ¿Qué es la API "GFFP"? | desconocido |
| 🔵 | 17 | CFS sync 1h: ¿Podemos mejorar la frecuencia? | #POC-KPI-001 |
| 🔵 | 18 | Volumen transaccional histórico por sucursal | Infra / DB sizing |

---

> **Nota para la reunión:** Las preguntas 🔴 son bloqueantes — sin respuesta no podemos arrancar esos módulos. Las 🟠 tienen riesgo legal/regulatorio — una respuesta incorrecta implica incumplimiento normativo. Las 🟡 afectan la lógica de negocio — se pueden asumir con riesgo pero luego hay que reescribir. Las 🔵 son de arquitectura — influyen en decisiones de infraestructura y performance.
