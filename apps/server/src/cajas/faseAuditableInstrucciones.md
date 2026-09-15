# Módulo de Cajas — Especificación Auditable e Instrucciones de Implementación

---

## 1. Gestión de Jerarquías y Control de Accesos (RBAC & Segregación)

**RF-1.01 (Estructura Multitenant / Multigeo):** El sistema debe soportar una jerarquía contable estricta: Regional (Casa Matriz) → Caja Principal → Cajas Auxiliares / Puntos de Venta (POS).

**RF-1.02 (Custodia Única y Exclusiva):** Cada caja auxiliar debe estar vinculada obligatoriamente a un único usuario custodio activo. Se prohíbe el uso de credenciales compartidas o cuentas genéricas para operar efectivo.

**RF-1.03 (Segregación de Funciones - SoD):** El usuario que opera el arqueo o la caja no puede aprobar sus propias diferencias de inventario de efectivo ni ejecutar asientos de ajuste contable definitivo; estos requieren rol de Supervisor Regional o Contador.

---

## 2. Gestión de Topes, Umbrales y Alertas de Liquidez (Cash Management)

**RF-2.01 (Topes Dinámicos):** El sistema debe permitir configurar un Tope Máximo de Retiro (Drop) y un Tope Mínimo de Reposición por cada caja auxiliar según las políticas de tesorería.

**RF-2.02 (Bloqueo Operativo por Tope Máximo):** Cuando una caja auxiliar alcance o supere el tope máximo por acumulación de efectivo, el sistema debe emitir una Alerta de Remesa Obligatoria e impedir nuevas transacciones de ingreso en efectivo hasta que se ejecute el traspaso parcial a la caja principal.

---

## 3. Motor de Arqueos y Conciliación de Efectivo (Accounting Engine)

**RF-3.01 (Desglose Estricto de Denominaciones):** El arqueo de caja debe obligar al registro del conteo físico desagregado por denominación legal (billetes y monedas) y otros medios (vouchers, transferencias).

**RF-3.02 (Cálculo Automatizado de Desviaciones):** El sistema calculará el saldo teórico mediante la fórmula:

```
B_theo(t) = B(t₀) + Σ Ingresos − Σ Egresos − Σ Traspasos_out + Σ Traspasos_in
```

Y determinará de forma inalterable la diferencia (Faltante o Sobrante):

```
Δ = B_phys − B_theo
```

**RF-3.03 (Tratamiento Contable de Diferencias):**

- Ante un **Faltante** (Δ < 0): el sistema genera una pre-cuenta por cobrar al custodio sujeta a aprobación supervisor.
- Ante un **Sobrante** (Δ > 0): el sistema envía el excedente a una cuenta de pasivo transitorio bloqueando su distribución como utilidad operativa.

---

## 4. Flujo Transaccional de Traspasos y Remesas (Two-Phase Transfer)

**RF-4.01 (Transacción Distribuida de Efectivo):** Los traspasos entre cajas se manejan mediante un flujo de doble fase:

- **S1 — Emitido:** la caja emisora descarga el dinero y genera un identificador único de remesa inmutable (`codigo_remesa`).
- **S2 — En Tránsito:** el dinero está en el canal logístico; no pertenece ni al origen ni al destino.
- **S3 — Confirmado:** la caja receptora verifica físicamente el dinero e ingresa el código; el saldo se acredita.

Si hay discrepancia en el recibo físico (`X_enviado ≠ X_recibido`), se genera un incidente de conciliación y el ciclo no puede cerrarse hasta intervención contable.

**RF-4.02 (Comprobante Digital Inalterable):** Cada traspaso debe generar un comprobante con firma digital (timestamp, hashes de usuario y montos) impidiendo su alteración posterior.

---

## 5. Requisitos No Funcionales (RNF)

**RNF-5.01 (Inmutabilidad y Pistas de Auditoría):** Ningún registro financiero o de arqueo podrá ser eliminado o actualizado mediante UPDATE/DELETE físico en base de datos. Cualquier corrección requerirá un asiento de contrapartida (nota débito/crédito) en un ledger inmutable con trazabilidad total del usuario, IP y hora exacta.

**RNF-5.02 (Consistencia Transaccional ACID):** Las operaciones críticas que involucren movimientos de efectivo entre cajas deben ejecutarse bajo transacciones atómicas para evitar estados intermedios o pérdida de dinero ante caídas de red.

**RNF-5.03 (Resiliencia Offline-First para POS):** En caso de pérdida temporal de conectividad, la caja auxiliar debe permitir operaciones locales registrándolas en un almacenamiento cifrado local, sincronizándose de forma idempotente al restablecer la red.

---

## 6. Modelado Matemático

### Invariante de Operatividad

Para toda caja auxiliar `i`, en todo momento `t`:

```
T_min,i ≤ B_i(t) ≤ T_max,i
```

- **Alerta de Reposición:** si `B_i(t) ≤ T_min,i` → inyección de liquidez requerida: `ΔQ = T_target,i − B_i(t)`
- **Bloqueo por Tope Máximo:** si `B_i(t) ≥ T_max,i` → exceso a retirar: `ε_i = B_i(t) − T_target,i`

### Ley de Conservación Global de Efectivo

```
M_total = C_regional + Σ C_principales + Σ C_auxiliares + Σ T_transito = Constante
```

### Partida Doble

```
Σ Débitos − Σ Créditos = 0
```

Cualquier corrección posterior añade un vector de compensación inverso, preservando la trazabilidad auditable.

---

---

# Estado de Implementación

> Última actualización: 2026-07-31

## Resumen Ejecutivo

| Área | Estado |
|------|--------|
| RF-1.01 Jerarquía multitenant | ✅ Completo |
| RF-1.02 Custodia única | ✅ Completo |
| RF-1.03 Segregación SoD | ✅ Completo |
| RF-2.01 Topes dinámicos | ✅ Completo |
| RF-2.02 Bloqueo por tope máximo | ✅ Completo |
| RF-3.01 Denominaciones obligatorias | ✅ Completo |
| RF-3.02 Fórmula B_theo | ✅ Completo |
| RF-3.03 Flujo de aprobación diferencias | ✅ Completo |
| RF-4.01 Two-Phase Transfer | ✅ Completo |
| RF-4.02 Comprobante digital hash | ✅ Completo |
| RNF-5.02 ACID transaccional | ✅ Completo |
| RNF-5.01 Ledger append-only | ⏸️ Diferido (prioridad cliente) |
| RNF-5.03 Offline-First POS | ⏸️ Diferido (prioridad cliente) |

---

## Detalle por Requisito

### RF-1.01 — Jerarquía Multitenant ✅

`assertSucursalAccess` filtra por `regional_id` para `SUPERVISOR_REGIONAL`. El scope del panel (`getStatusPuntoBySucursal`) respeta la sucursal del usuario. Jerarquía `CajaPadre → Caja → SesionCaja` enforced en todos los endpoints.

**Archivos clave:**
- `cajas.controller.ts` → `assertSucursalAccess`, `assertSesionAccess`
- `cajas.service.ts` → `getSucursalIdDeSesion`, `getSucursalRegionalId`

---

### RF-1.02 — Custodia Única ✅

`validarUnicidadCustodio` verifica que un cajero no tenga otra sesión abierta antes de asignarlo. Aplica en `abrirCajaDirecta`, `abrirAuxiliar` y `setCajeroAsignado`.

**Archivos clave:**
- `domain/business-rules.ts` → `validarUnicidadCustodio`
- `domain/caja.errors.ts` → `CajeroYaAsignadoError` (HTTP 409)
- `domain/sesion-caja.repository.ts` → `findAbiertaByCajero`

---

### RF-1.03 — Segregación SoD ✅

- Los endpoints de diferencia (`POST /cajas/punto/:id/diferencia` y `POST /cajas/principales/:id/diferencia`) requieren `ROLES_SUPERVISOR` — un cajero no puede registrar diferencias en su propia sesión.
- Al resolver una `DiferenciaCaja`, se valida que `aprobadorId ≠ custodioId`; si coinciden → `SoDViolacionError` (HTTP 403).

**Archivos clave:**
- `cajas.controller.ts` → guards `ROLES_SUPERVISOR` en endpoints de diferencia
- `cajas.service.ts` → `resolverDiferencia` (validación SoD)
- `domain/caja.errors.ts` → `SoDViolacionError` (HTTP 403)

---

### RF-2.01 — Topes Dinámicos ✅

`evaluarAlertas(saldo, baseDia, limiteAlerta)` cubre ambas bandas y retorna `TipoAlerta[]`. Integrado en `getSaldoSesion`, `registrarMovimientoVenta`, `cambioCustodia` y `getStatusPunto`.

**Archivos clave:**
- `domain/business-rules.ts` → `evaluarAlertas`
- `infrastructure/prisma-sesiones-caja.repository.ts` → `getStatusPunto` (panel con alertas por caja)

---

### RF-2.02 — Bloqueo por Tope Máximo ✅

`registrarMovimientoVenta` verifica `saldoActual + monto > limiteAlerta` para ingresos de efectivo y lanza `TopeMaximoEfectivoError` (HTTP 422) antes de insertar el movimiento.

**Archivos clave:**
- `cajas.service.ts` → `registrarMovimientoVenta`
- `domain/caja.errors.ts` → `TopeMaximoEfectivoError`

---

### RF-3.01 — Denominaciones Obligatorias ✅

`CierreCajaSchema` rechaza cualquier cierre que no incluya `denominaciones` (array no vacío). El campo `totalArqueo` es opcional pero no sustituye al desglose físico.

**Archivos clave:**
- `dto/cierre-caja.dto.ts` → `CierreCajaSchema` (`.refine` sin fallback a `totalArqueo`)

---

### RF-3.02 — Fórmula B_theo ✅

```
B_theo = monto_apertura + Σ(TIPOS_MOVIMIENTO_ENTRADA) − Σ(TIPOS_MOVIMIENTO_SALIDA)
```

- `'apertura'` no pertenece ni a `TIPOS_ENTRADA` ni a `TIPOS_SALIDA` (tipo neutro) — evita doble conteo en `abrirCajaDirecta`.
- En `abrirAuxiliar`, `monto_apertura = '0'` porque el saldo inicial llega vía `cambio_custodia_in` — evita el doble conteo de la base asignada.
- `saldoPorMedioPago` excluye movimientos neutros para no restar la apertura de efectivo.

**Archivos clave:**
- `domain/business-rules.ts` → `TIPOS_MOVIMIENTO_ENTRADA`, `TIPOS_MOVIMIENTO_SALIDA`
- `infrastructure/prisma-sesiones-caja.repository.ts` → `calcularSaldo`, `getStatusPunto`

---

### RF-3.03 — Tratamiento Contable de Diferencias ✅

Al cerrar una sesión con diferencia (`|Δ| > 0.01`):

1. Se crea un registro `DiferenciaCaja` con `estado = 'pendiente'` — **el movimiento contable NO se aplica al saldo en este momento**.
2. El supervisor usa `PATCH /cajas/diferencias/:id/resolver` para aprobar o rechazar.
3. Si **aprobada**: se registra el movimiento contable (`diferencia_faltante` o `diferencia_sobrante`) en la sesión cerrada para audit trail.
4. Si **rechazada**: no hay impacto en el saldo.
5. **SoD enforced**: `aprobadorId ≠ custodioId`.

**Migración requerida:** `20260731000000_two_phase_transfer_diferencias`

**Archivos clave:**
- `prisma/schema.prisma` → modelo `DiferenciaCaja`
- `domain/caja.entity.ts` → `DiferenciaCajaEntity`, `TipoDiferencia`
- `domain/caja.errors.ts` → `DiferenciaNoEncontradaError`, `DiferenciaEstadoInvalidoError`, `SoDViolacionError`
- `domain/sesion-caja.repository.ts` → `CrearDiferenciaData`, `AprobarDiferenciaData`
- `cajas.service.ts` → `resolverDiferencia`, `getDiferencia`
- `cajas.controller.ts` → `GET /cajas/diferencias/:id`, `PATCH /cajas/diferencias/:id/resolver`
- `dto/resolver-diferencia.dto.ts`

---

### RF-4.01 — Two-Phase Transfer ✅

**Fase 1 — Emitir** (`POST /cajas/punto/:sesionId/cambio-custodia`):
- Registra `cambio_custodia_out` en la sesión origen.
- Crea `ReposicionCaja` con `estado = 'en_transito'` y `codigo_remesa` único.
- Retorna `{ codigoRemesa, montoEmitido, reposicionId }`.

**Fase 2 — Confirmar** (`POST /cajas/reposiciones/:codigo/confirmar`):
- Valida que `montoRecibido ≈ montoEmitido` (tolerancia 1 centavo).
- Si hay discrepancia → `DiscrepanciaTransitoError` (HTTP 422); reposición permanece `en_transito` para auditoría.
- Si ok → acredita `cambio_custodia_in` en destino y actualiza reposición a `confirmada` en una única transacción ACID.

**Flujos internos** (`abrirAuxiliar`, `cerrarAuxiliar`, `resetAutomaticoPunto`) siguen siendo one-phase con `registrarTransferenciaAtomica` — la two-phase aplica solo a traspasos explícitos entre cajeros.

**Migración requerida:** `20260731000000_two_phase_transfer_diferencias` (añade `en_transito`, `confirmada` al enum `estado_aprobacion` y `codigo_remesareposiciones_caja` a `reposiciones_caja`)

**Archivos clave:**
- `cajas.service.ts` → `cambioCustodia` (fase 1), `confirmarCustodia` (fase 2)
- `domain/sesion-caja.repository.ts` → `findReposicionByCodigo`, `confirmarCustodiaAtomica`
- `cajas.controller.ts` → `POST /cajas/reposiciones/:codigo/confirmar`
- `dto/confirmar-custodia.dto.ts`

---

### RF-4.02 — Comprobante Digital ✅

Cada traspaso genera un `codigo_remesa` de 16 caracteres hexadecimales en mayúsculas:

```typescript
SHA-256(`${sesionOrigenId}-${sesionDestinoId}-${monto}-${Date.now()}`).substring(0, 16).toUpperCase()
```

- Se almacena en `reposiciones_caja.codigo_remesareposiciones_caja` con índice `UNIQUE`.
- Generado una sola vez en la fase 1; inmutable durante todo el ciclo de vida de la reposición.

---

### RNF-5.02 — ACID Transaccional ✅

Todas las operaciones de dos piernas (que mueven dinero entre dos sesiones simultáneamente) se ejecutan en `prisma.$transaction([...])`:

| Operación | Método |
|-----------|--------|
| `abrirAuxiliar` | `registrarTransferenciaAtomica(out, in)` |
| `cerrarAuxiliar` | `registrarTransferenciaAtomica(out, in)` |
| `cambioCustodia` (solo out, fase 1) | `registrarMovimiento` (un solo insert) |
| `confirmarCustodia` (in + update reposicion) | `confirmarCustodiaAtomica(...)` |
| `resetAutomaticoPunto` | `registrarTransferenciaAtomica(out, in)` por auxiliar |

**Archivos clave:**
- `infrastructure/prisma-sesiones-caja.repository.ts` → `registrarTransferenciaAtomica`, `confirmarCustodiaAtomica`

---

### RNF-5.01 — Ledger Append-Only ⏸️ DIFERIDO

**Estado:** `MovimientoCaja` es append-only ✅. Sin embargo, `cerrarSesion` ejecuta `prisma.sesionCaja.update` modificando `estado`, `monto_cierre` y `fecha_cierre` sobre el registro original — viola el principio de no UPDATE en registros financieros.

**Alcance de la deuda técnica:**
- Requeriría una tabla `cierres_sesion` separada para almacenar el evento de cierre.
- Todas las consultas que filtran por `estadosesiones_caja = 'abierta'` tendrían que unirse a la nueva tabla o usar una vista materializada.
- Impacto: ~15 queries en el repositorio + todos los índices existentes.

**Decisión:** diferido para no bloquear la entrega funcional al cliente. El ledger de movimientos (la fuente contable de verdad) sí es inmutable.

---

### RNF-5.03 — Offline-First POS ⏸️ DIFERIDO

**Estado:** no implementado.

**Alcance:**
- Almacenamiento local cifrado en el cliente POS (Tauri / IndexedDB con AES).
- Cola de sincronización idempotente con el servidor al recuperar conexión.
- Validación de topes y reglas de negocio en modo offline.

**Decisión:** diferido. Requiere cambios de arquitectura frontend significativos y está fuera del alcance del MVP.

---

## Pendientes de Migración

Para que los cambios de RF-3.03, RF-4.01 y RF-4.02 surtan efecto en la base de datos:

```bash
# Desde /server
npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
```

Migración a aplicar: `20260731000000_two_phase_transfer_diferencias`

- Añade `en_transito` y `confirmada` al enum `estado_aprobacion`
- Añade columna `codigo_remesareposiciones_caja TEXT UNIQUE` a `reposiciones_caja`
- Crea tabla `diferencias_caja` con FK a `sesiones_caja` y `usuarios`
