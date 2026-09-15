# Reporte de Cambios — Módulo Cajas (2026-07-31)

> Sprint de corrección y completitud del módulo de cajas. Cubre bugs críticos, nuevas reglas de negocio, funcionalidades de dos fases y el modelo matemático implementado vs pendiente.

---

## 1. Bugs Críticos Corregidos

### Bug 1 — Doble conteo del monto_apertura en B_theo

**Problema:** `calcularSaldo` sumaba el tipo `'apertura'` dentro de los movimientos de ENTRADA, haciendo que el saldo teórico fuera `2 × monto_apertura` al abrir una caja directa.

**Fix:** `'apertura'` se removió de `TIPOS_MOVIMIENTO_ENTRADA` y `TIPOS_MOVIMIENTO_SALIDA`. El campo `monto_apertura` se suma una sola vez como base; los movimientos solo acumulan a partir del primer ingreso/egreso real.

**Archivos:** `domain/business-rules.ts`, `infrastructure/prisma-sesiones-caja.repository.ts`

---

### Bug 2 — monto_apertura incorrecto en abrirAuxiliar

**Problema:** `abrirAuxiliar` persistía el monto asignado como `monto_apertura`, lo que causaba que `B_theo` contara el dinero dos veces: una vez como base y otra como `cambio_custodia_in`.

**Fix:** `abrirAuxiliar` ahora usa `montoApertura: '0'`. El saldo inicial llega exclusivamente vía el movimiento `cambio_custodia_in`, que sí entra en `TIPOS_MOVIMIENTO_ENTRADA`.

**Archivos:** `application/cajas.service.ts` → `abrirAuxiliar`

---

### Bug 3 — saldoPorMedioPago incluía tipo 'apertura' como egreso

**Problema:** El desglose de saldo por medio de pago restaba el tipo `'apertura'` como si fuera un egreso, reportando saldos negativos incorrectos en el panel de status.

**Fix:** `saldoPorMedioPago` filtra todos los tipos neutros (no están ni en ENTRADA ni SALIDA) antes de acumular.

**Archivos:** `infrastructure/prisma-sesiones-caja.repository.ts` → `getStatusPunto`

---

### Bug 4 — confirmarCustodia no era ACID

**Problema:** `confirmarCustodia` ejecutaba `registrarMovimiento` (INSERT) y `confirmarReposicion` (UPDATE) como dos operaciones independientes. Si la segunda fallaba, el dinero aparecía en el destino pero la reposición permanecía `en_transito`; una segunda llamada duplicaba el crédito.

**Fix:** Se creó `confirmarCustodiaAtomica` que envuelve ambas operaciones en `prisma.$transaction([...])`.

**Archivos:** `infrastructure/prisma-sesiones-caja.repository.ts` → `confirmarCustodiaAtomica`

---

### Bug 5 — Import muerto de calcularDiferenciaFaltante / calcularDiferenciaSobrante

**Problema:** Después de refactorizar RF-3.03, `cajas.service.ts` seguía importando `calcularDiferenciaFaltante` y `calcularDiferenciaSobrante` que ya no existían, causando error de compilación.

**Fix:** Se eliminó la línea de import.

**Archivos:** `application/cajas.service.ts`

---

### Bug 6 — Diferencias aplicadas inmediatamente al saldo sin aprobación

**Problema:** `cerrarAuxiliar` y `cerrarSesionPrincipal` registraban `diferencia_faltante`/`diferencia_sobrante` como movimiento contable en el mismo acto del cierre, sin control supervisor ni SoD.

**Fix:** Se reemplazó por la creación de un registro `DiferenciaCaja` con `estado = 'pendiente'`. El movimiento contable solo se aplica cuando un supervisor aprueba con `PATCH /cajas/diferencias/:id/resolver`.

**Archivos:** `application/cajas.service.ts` → `cerrarAuxiliar`, `cerrarSesionPrincipal`

---

## 2. Nuevas Reglas de Negocio Implementadas

### RF-1.02 — Custodia Única (BR-CAJ-008)

`validarUnicidadCustodio(cajeroId, tieneSesionAbierta)` lanza `CajeroYaAsignadoError` (HTTP 409) si el cajero ya tiene otra sesión abierta. Aplica en `abrirCajaDirecta`, `abrirAuxiliar` y `setCajeroAsignado`.

### RF-1.03 — Segregación de Funciones (SoD)

- Endpoints de diferencia protegidos con `ROLES_SUPERVISOR` — el cajero no puede registrar diferencias de su propia sesión.
- `resolverDiferencia` valida `aprobadorId ≠ custodioId`; si coinciden → `SoDViolacionError` (HTTP 403).

### RF-2.02 — Bloqueo por Tope Máximo

`registrarMovimientoVenta` verifica `saldoActual + monto > limiteAlerta` para ingresos de efectivo y lanza `TopeMaximoEfectivoError` (HTTP 422) antes de insertar el movimiento.

### RF-3.01 — Denominaciones Obligatorias

`CierreCajaSchema` rechaza cualquier cierre sin `denominaciones` (array no vacío). Eliminado el fallback permisivo `|| d.totalArqueo`.

---

## 3. Nuevas Funcionalidades

### RF-3.03 — Flujo de Aprobación de Diferencias

**Entidades nuevas:** `DiferenciaCaja` (tabla `diferencias_caja`), `DiferenciaCajaEntity`, `TipoDiferencia`.

**Flujo:**
1. Cierre con `|Δ| > 0.01` → crea `DiferenciaCaja(estado='pendiente')`.
2. Supervisor: `GET /cajas/diferencias/:id` para consultar.
3. Supervisor: `PATCH /cajas/diferencias/:id/resolver` → `{estado: 'aprobada'|'rechazada'}`.
4. Si aprobada: se inserta el movimiento contable en la sesión cerrada (audit trail).
5. SoD enforced en el paso 3.

**Errores nuevos:** `DiferenciaNoEncontradaError` (404), `DiferenciaEstadoInvalidoError` (409), `SoDViolacionError` (403).

---

### RF-4.01 — Two-Phase Transfer (Remesas)

**Fase 1 — Emitir** (`POST /cajas/punto/:sesionId/cambio-custodia`):
- Registra `cambio_custodia_out` en sesión origen.
- Crea `ReposicionCaja(estado='en_transito', codigoRemesa=<hash>)`.
- Retorna `{ codigoRemesa, montoEmitido, reposicionId, estado: 'en_transito' }`.

**Fase 2 — Confirmar** (`POST /cajas/reposiciones/:codigo/confirmar`):
- Valida `montoRecibido ≈ montoEmitido` (tolerancia: 1 centavo).
- Si discrepancia → `DiscrepanciaTransitoError` (HTTP 422); reposición permanece `en_transito`.
- Si ok → `confirmarCustodiaAtomica`: INSERT `cambio_custodia_in` + UPDATE reposición a `confirmada` en una sola transacción ACID.

**Nota:** `abrirAuxiliar`, `cerrarAuxiliar` y `resetAutomaticoPunto` siguen usando `registrarTransferenciaAtomica` (one-phase) porque son flujos internos, no remesas entre cajeros distintos.

**Errores nuevos:** `ReposicionNoEncontradaError` (404), `ReposicionEstadoInvalidoError` (409), `DiscrepanciaTransitoError` (422).

---

### RF-4.02 — Comprobante Digital Inalterable

```typescript
codigo_remesa = SHA256(`${sesionOrigenId}-${sesionDestinoId}-${monto}-${Date.now()}`)
  .digest('hex')
  .substring(0, 16)
  .toUpperCase()
```

- Persistido en `reposiciones_caja.codigo_remesareposiciones_caja` con índice `UNIQUE`.
- Generado una sola vez en Fase 1; inmutable durante todo el ciclo de vida.

---

## 4. Matemáticas Implementadas

### B_theo — Saldo Teórico

```
B_theo(t) = monto_apertura + Σ(TIPOS_MOVIMIENTO_ENTRADA) − Σ(TIPOS_MOVIMIENTO_SALIDA)
```

**Conjuntos:**

| Conjunto | Tipos incluidos |
|----------|----------------|
| `TIPOS_MOVIMIENTO_ENTRADA` | `cambio_custodia_in`, `reposicion`, `venta_producto`, `venta_servicio`, `venta_estampilla`, `giro_emision_cobro`, `recaudo`, `diferencia_sobrante`, `apartado_postal` |
| `TIPOS_MOVIMIENTO_SALIDA` | `cambio_custodia_out`, `giro_pago`, `consignacion`, `diferencia_faltante`, `pago_administrativo`, `anulacion`, `traslado_caja_fuerte` |
| Neutros (ni ENTRADA ni SALIDA) | `apertura` |

**Invariante:** `'apertura'` no se suma dos veces; `monto_apertura = '0'` en auxiliares para que la base llegue solo vía `cambio_custodia_in`.

---

### Δ — Diferencia de Arqueo

```
Δ = B_phys − B_theo
```

- `B_phys` = `Σ(denominaciones × valor_unitario)` + total de otros medios del arqueo físico.
- `Δ > 0` → Sobrante: pasivo transitorio, genera `DiferenciaCaja(tipo='sobrante')`.
- `Δ < 0` → Faltante: cuenta por cobrar al custodio, genera `DiferenciaCaja(tipo='faltante')`.
- `|Δ| ≤ 0.01` → sin diferencia material.

---

### Invariante de Operatividad por Caja

```
T_min,i ≤ B_i(t) ≤ T_max,i
```

- `B_i(t) ≤ T_min,i` → Alerta `reposicion_requerida` (inyección de liquidez).
- `B_i(t) ≥ T_max,i` → Alerta `limite_maximo` + bloqueo de ingresos (`TopeMaximoEfectivoError`).

Implementado en `evaluarAlertas(saldo, baseDia, limiteAlerta)` → `TipoAlerta[]`.

---

### Ley de Conservación Global de Efectivo

```
M_total = C_regional + Σ C_principales + Σ C_auxiliares + Σ T_transito = Constante
```

Garantizada por:
- `registrarTransferenciaAtomica`: débito en origen y crédito en destino en la misma transacción.
- `confirmarCustodiaAtomica`: acredita destino y confirma reposición en la misma transacción.
- Saldo `en_transito` visible pero no asignado a ninguna sesión hasta `confirmarCustodia`.

---

### Partida Doble (audit trail de diferencias)

```
Σ Débitos − Σ Créditos = 0
```

Diferencias aprobadas insertan el movimiento contable inverso en la sesión cerrada (nota débito/crédito), preservando el ledger de movimientos como fuente de verdad inmutable.

---

### Fórmula de Reposición

**Fase 1:**
```
saldo_origen_post = B_theo(origen) − monto_remesa
```

**Fase 2:**
```
saldo_destino_post = B_theo(destino) + monto_recibido   (si |monto_recibido − monto_remesa| ≤ 0.01)
```

Si discrepancia > 0.01 → incidente; reposición permanece `en_transito`.

---

## 5. Matemáticas Pendientes (Deuda Técnica)

### T_target — Reposición Ideal ✅ (implementado)

```
ΔQ_i = T_target,i − B_i(t)   cuando B_i(t) ≤ T_min,i
```

Campo `t_targetcajas DECIMAL(18,2)` añadido a la tabla `cajas`. El panel `StatusPunto` expone `tTarget` y `deltaReposicion` en cada `CardAuxiliar`. `deltaReposicion = max(0, tTarget − saldoActual)` solo cuando está activa la alerta `reposicion_caja` y el campo está configurado.

**Migración:** `20260731000002_t_target_caja`

---

### T_transito — Efectivo en Canal Logístico ✅ (implementado)

```
T_transito = Σ monto de reposiciones con estado='en_transito' (sesiones del punto)
```

Campo `tTransito` añadido al panel `PanelPunto`. Se calcula en `getStatusPunto` mediante una agregación sobre `reposiciones_caja` filtrando por `estado = 'en_transito'` y sesiones de origen del punto. Permite cerrar la ecuación de conservación:

```
M_total = C_regional + Σ C_principales + Σ C_auxiliares + T_transito = Constante
```

---

### RNF-5.01 — Ledger Append-Only (Diferido)

`cerrarSesion` ejecuta `prisma.sesionCaja.update` → viola el principio de no UPDATE en registros financieros.

**Deuda técnica:**
- Crear tabla `cierres_sesion` para almacenar el evento de cierre como INSERT.
- Actualizar ~15 queries que filtran por `estadosesiones_caja = 'abierta'`.
- Posible vista materializada para no romper índices existentes.

**Decisión:** diferido para no bloquear la entrega funcional. El ledger de movimientos (`movimientos_caja`) sí es append-only.

---

### RNF-5.03 — Offline-First POS (Diferido)

No implementado. Requiere:
- Almacenamiento local cifrado (Tauri / IndexedDB con AES).
- Cola de sincronización idempotente.
- Validación de reglas de negocio en modo offline.

**Decisión:** fuera del alcance del MVP. Arquitectura frontend aún no definida.

---

### IP Traceability

`EventoAuditoria` captura `ip_origeneventos_auditoria` pero depende de que el middleware HTTP lo inyecte en el `auditStore`. Si el request no pasa por `AuditMiddleware`, la IP queda `null`.

**Pendiente:** validar cobertura en todos los endpoints de cajas, especialmente los de resolución de diferencias.

---

## 6. Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `prisma/schema.prisma` | Enum `estado_aprobacion` (+`en_transito`, `confirmada`); campo `codigo_remesareposiciones_caja`; modelo `DiferenciaCaja`; relaciones en `SesionCaja` y `Usuario` |
| `prisma/migrations/20260731000000_two_phase_transfer_diferencias/migration.sql` | Nueva migración (ALTER ENUM, ADD COLUMN, CREATE TABLE, FK, índices) |
| `domain/caja.entity.ts` | `EstadoAprobacion` actualizado; `TipoDiferencia`; `ReposicionCajaEntity.codigoRemesa`; clase `DiferenciaCajaEntity` |
| `domain/caja.errors.ts` | 6 nuevos errores de dominio |
| `domain/business-rules.ts` | `validarUnicidadCustodio`; corrección de `TIPOS_MOVIMIENTO_ENTRADA/SALIDA` |
| `domain/sesion-caja.repository.ts` | Interfaces `CrearDiferenciaData`, `AprobarDiferenciaData`; 7 métodos nuevos en `ISesionesCajaRepository` |
| `infrastructure/prisma-sesiones-caja.repository.ts` | `SELECT_REPOSICION`, `toReposicionEntity`, `findReposicionById`, `findReposicionByCodigo`, `confirmarReposicion`, `confirmarCustodiaAtomica`, `SELECT_DIFERENCIA`, `toDiferenciaEntity`, `crearDiferencia`, `findDiferenciaById`, `resolverDiferencia`, `registrarTransferenciaAtomica` |
| `application/cajas.service.ts` | `cambioCustodia` reescrito (Fase 1); `confirmarCustodia` nuevo (Fase 2 ACID); `getDiferencia`; `resolverDiferencia` con SoD; `cerrarAuxiliar` y `cerrarSesionPrincipal` con diferencia pendiente; eliminado import muerto |
| `infrastructure/cajas.controller.ts` | 3 endpoints nuevos (`POST /reposiciones/:codigo/confirmar`, `GET /diferencias/:id`, `PATCH /diferencias/:id/resolver`) |
| `src/prisma/prisma.service.ts` | Getter `diferenciaCaja` |
| `dto/cierre-caja.dto.ts` | `CierreCajaSchema` requiere `denominaciones`; eliminado fallback `totalArqueo` |
| `dto/confirmar-custodia.dto.ts` | Nuevo DTO (Fase 2) |
| `dto/resolver-diferencia.dto.ts` | Nuevo DTO (aprobación de diferencias) |
| `faseAuditableInstrucciones.md` | Sección "Estado de Implementación" añadida |

---

## 7. Acción Pendiente en Base de Datos

```bash
# Desde /server
npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
```

Migración: `20260731000000_two_phase_transfer_diferencias`

- Añade `en_transito` y `confirmada` al enum `estado_aprobacion`
- Añade columna `codigo_remesareposiciones_caja TEXT UNIQUE` a `reposiciones_caja`
- Crea tabla `diferencias_caja` con FK a `sesiones_caja` y `usuarios`
