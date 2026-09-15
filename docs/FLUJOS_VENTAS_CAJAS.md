# Flujos Establecidos — Módulos Ventas y Cajas

> Estado al 2026-07-31. Refleja el código en `src/cajas/` y `src/ventas/`.

---

## Jerarquía del negocio

```
Comercio
  └── Regional[]
        └── Sucursal[]
              └── CajaPadre  (caja principal — 1 por sucursal en el schema actual)
                    ├── SesionCaja PRINCIPAL  (abre la CajaFuerte/General)
                    └── Caja[]  (cajas auxiliares: pos, menor, pagos…)
                          └── SesionCaja AUXILIAR
```

- El **inventario** vive en `Sucursal`, no en caja. Cuando se confirma una venta, el stock se descuenta con `sucursalId` obtenido desde `SesionCaja.sucursalId`.
- `CajaPadreId` es la FK que agrupa todas las cajas de un mismo punto de venta.

---

## Módulo Cajas — `src/cajas/`

### Estado: IMPLEMENTADO

Todos los flujos están en `cajas.service.ts` + `cajas.controller.ts`.

---

### F-C1 · Apertura de sesión principal

**Endpoint:** `POST /cajas/principales/:cajaPadreId/sesion/abrir`
**Rol:** `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Pasos:**
1. Verificar que `CajaPadre` existe.
2. Buscar la `Caja` de tipo `general` del padre → `findCajaGeneralByPadre`.
3. Validar que no existe `SesionCaja` abierta para esa caja general.
4. Crear `SesionCaja` con `montoApertura`.
5. Registrar movimiento tipo `apertura` con el saldo inicial.

**Cálculo:** `buildBaseAperturaPrincipal(montoApertura)` en `domain/calculos/base-apertura.ts`.

---

### F-C2 · Apertura de caja auxiliar

**Endpoint:** `POST /cajas/principales/:sesionId/auxiliar/abrir`
**Rol:** `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Pasos:**
1. Verificar sesión principal abierta.
2. Verificar que la caja auxiliar no tiene sesión activa.
3. Calcular base disponible: `calcularBaseAsignadaAuxiliar(saldoPrincipal, baseAsignada)`.
4. Crear sesión auxiliar.
5. Registrar `cambio_custodia_out` en principal y `apertura` en auxiliar (en paralelo).
6. Crear registro de `Reposicion` (estado `aprobada`, motivo `apertura_auxiliar`).

**Cálculo:** `buildDebitoPrincipalPorApertura` + `buildCreditoAuxiliarPorApertura` en `domain/calculos/cambio-custodia.ts`.

---

### F-C3 · Apertura directa de caja (sin sesión principal)

**Endpoint:** `POST /cajas/auxiliares/:cajaId/abrir`
**Rol:** `CAJERO`, `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Pasos:**
1. Verificar que la caja existe y no tiene sesión abierta.
2. Crear sesión con `baseAsignada` y `cajeroAsignadoId` opcional.
3. Registrar movimiento tipo `apertura`.

---

### F-C4 · Cierre de caja auxiliar

**Endpoint:** `POST /cajas/punto/:sesionId/cierre`
**Rol:** `CAJERO`, `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Pasos:**
1. Calcular `saldoEsperado` (suma de movimientos electrónicos).
2. Calcular arqueo físico por denominaciones o tomar `totalArqueo` libre.
3. Buscar la sesión de la `CajaGeneral` del mismo padre para devolver saldo.
4. Si hay sesión principal abierta:
   - Registrar `cambio_custodia_out` en auxiliar y `cambio_custodia_in` en principal.
   - Crear `Reposicion` (motivo `cierre_auxiliar`).
5. Si hay diferencia (±$0.01):
   - Registrar movimiento `sobrante_caja` o `faltante_caja` con nota "PENDIENTE APROBACIÓN".
6. Cerrar la sesión.
7. Evaluar cierre forzado si la sesión supera 24 horas (`evaluarCierreForzado`).

**Retorna:** `{ sesion, diferenciaCierre, forzado }`

---

### F-C5 · Cierre de sesión principal

**Endpoint:** `POST /cajas/principales/:sesionId/sesion/cerrar`
**Rol:** `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Prerrequisito:** Todas las cajas auxiliares deben estar cerradas.

**Pasos:**
1. Verificar sesión abierta.
2. Buscar sesiones abiertas del punto via `findAbiertasByPunto(cajaPadreId)`.
3. Lanzar `AuxiliaresAbiertasError` si alguna auxiliar sigue abierta.
4. Calcular saldo y arqueo.
5. Registrar movimiento `cierre`.
6. Si hay diferencia: registrar `sobrante_caja` o `faltante_caja` pendiente aprobación.
7. Cerrar sesión.

---

### F-C6 · Cambio de custodia entre sesiones

**Endpoint:** `POST /cajas/punto/:sesionId/cambio-custodia`
**Rol:** `CAJERO`, `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Pasos:**
1. Verificar sesión origen y destino abiertas.
2. Calcular `calcularCambioCustodiaEnSesion(monto, saldoOrigen)`.
3. Registrar `cambio_custodia_out` en origen y `cambio_custodia_in` en destino.
4. Crear `Reposicion`.
5. Retornar nuevo saldo destino + alertas.

---

### F-C7 · Consignación bancaria

**Endpoint registrar:** `POST /cajas/principales/:sesionId/consignacion`
**Endpoint aprobar:** `PATCH /cajas/consignacion/:id/estado`
**Roles:** Registrar = `CAJERO`; Aprobar = `TESORERIA`, `SUPERVISOR_REGIONAL`

**Pasos:**
1. Validar monto (`validarMontoConsignacion`).
2. Crear consignación en estado `pendiente`.
3. Al aprobar: registrar movimiento `consignacion_aprobada` que suma el monto a la sesión.
4. Al rechazar: sin movimiento.

**Regla de negocio:** El monto consignado no puede superar el saldo disponible en sesión.

---

### F-C8 · Pago administrativo

**Endpoint:** `POST /cajas/principales/:sesionId/pago-administrativo`
**Rol:** `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

**Pasos:**
1. Validar sesión abierta y saldo suficiente.
2. `buildPagoAdministrativo(valor, descripcion, saldo)`.
3. Registrar movimiento tipo `pago_administrativo`.

Usado para pagos como RETEICA, nómina parcial, servicios, etc.

---

### F-C9 · Diferencias de caja

**Endpoint principal:** `POST /cajas/principales/:sesionId/diferencia`
**Endpoint auxiliar:** `POST /cajas/punto/:sesionId/diferencia`
**Rol:** `CAJERO`, `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

Permite registrar manualmente un `sobrante_caja` o `faltante_caja`. También se genera automáticamente en los cierres F-C4 y F-C5.

---

### F-C10 · Panel de status del punto

**Endpoint por cajaPadreId:** `GET /cajas/principales/:cajaPadreId/status`
**Endpoint por sucursalId:** `GET /cajas/sucursal/:sucursalId/status`
**Rol:** todos

Retorna el panel general (base, caja general, caja fuerte, pagos, moneda circulante, `debeReset`) más la lista de cajas auxiliares con su sesión activa.

- `CAJERO` solo ve su propia caja.
- `componerPanelStatus()` agrupa los movimientos de la `CajaGeneral` en los totales del panel.
- `evaluarHoraReset()` indica si el turno debe reiniciarse por hora configurada.

---

### F-C11 · Capacidad del punto

**Endpoint:** `GET /cajas/principales/:cajaPadreId/capacidad`
**Rol:** `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

Calcula cuántas auxiliares más pueden abrir según la base general disponible. Usa `calcularCapacidadPunto`.

---

### F-C12 · CRUD estructural de cajas

| Operación | Endpoint | Rol |
|---|---|---|
| Listar cajaPadres | `GET /cajas` | GESTOR |
| Crear cajaPadre | `POST /cajas` | ADMIN |
| Actualizar cajaPadre | `PATCH /cajas/:id` | GESTOR |
| Eliminar cajaPadre | `DELETE /cajas/:id` | ADMIN |
| Listar auxiliares | `GET /cajas/auxiliares` | GESTOR |
| Crear auxiliar | `POST /cajas/auxiliares` | ADMIN |
| Actualizar auxiliar | `PATCH /cajas/auxiliares/:id` | GESTOR |
| Eliminar auxiliar | `DELETE /cajas/auxiliares/:id` | ADMIN |

---

## Módulo Ventas — `src/ventas/`

### Estado: IMPLEMENTADO

Todos los flujos están en `ventas.service.ts` + `ventas.controller.ts`.

---

### F-V1 · Flujo de venta (carrito)

#### Paso 1 — Iniciar venta
**Endpoint:** `POST /ventas/punto/:cajaId/iniciar`
**Rol:** `CAJERO`, `ADMIN_SISTEMA`

1. Obtener `SesionCaja` activa via `cajasService.getSesionActivaByCaja(cajaId)`.
2. Validar que el CAJERO opera su propia caja asignada.
3. Buscar cliente por documento (`tipoDocumento` + `numeroDocumento`).
4. Crear registro `Venta` en estado `pendiente`.

**Retorna:** `{ venta, cliente }`

---

#### Paso 2 — Agregar productos al carrito
**Endpoint:** `POST /ventas/:ventaId/carrito/producto?cajaId=N`
**Rol:** `CAJERO`, `ADMIN_SISTEMA`

1. Verificar venta activa y perteneciente a la sesión.
2. Buscar producto en el catálogo de la sucursal.
3. Para productos tipo `otro` (servicios especiales):
   - Validar `cantidadMinima` y `cantidadMaxima`.
   - Calcular precio escalonado via `calcularPrecioPorCantidad` con `TarifasEspecial`.
4. Calcular `subtotal = precio × cantidad - descuento`.
5. Agregar `VentaDetalle` y recalcular totales del carrito.

---

#### Paso 3 — Confirmar pago
**Endpoint:** `POST /ventas/:ventaId/confirmar?cajaId=N`
**Rol:** `CAJERO`, `ADMIN_SISTEMA`

1. Verificar carrito no vacío.
2. Para items tipo `otro`: verificar stock en `InventarioService.getStock(sucursalId, productoId)`.
3. Para pago en efectivo: validar `efectivoRecibido >= total`.
4. Confirmar venta en BD.
5. Para cada servicio especial: `inventarioService.descontarInventario(...)` con `referenciaTipo: 'Venta'`.
6. Determinar tipo de movimiento de caja:
   - Servicios especiales → `venta_servicio`
   - Estampillas/filatelia → `venta_estampilla`
   - Resto → `venta_producto`
7. `cajasService.registrarMovimientoVenta(sesionCajaId, tipo, monto, medioPago, ventaId)`.
8. Calcular cambio si efectivo.

**Retorna:** `{ venta, movimiento, saldoActual, alertas, cambio }`

---

#### Paso 4 — Anular venta
**Endpoint:** `POST /ventas/:ventaId/anular?cajaId=N`
**Rol:** `SUPERVISOR_REGIONAL`, `ADMIN_SISTEMA`

1. Verificar venta activa y en sesión correcta.
2. Anular venta en BD.
3. Para servicios especiales: `inventarioService.restaurarInventario(...)` con `referenciaTipo: 'VentaAnulada'`.
4. Determinar tipo de movimiento de anulación via `buildAnulacionVenta`.
5. Registrar movimiento de egreso (reversa) en caja.

**Retorna:** `{ venta, movimiento, saldoActual, alertas, motivo }`

---

#### Eliminar ítem del carrito
**Endpoint:** `DELETE /ventas/:ventaId/carrito/:detalleId`
**Rol:** `CAJERO`, `ADMIN_SISTEMA`

Elimina el `VentaDetalle` y recalcula totales.

---

### F-V2 · Apartado Postal

#### Contratar apartado
**Endpoint:** `POST /ventas/punto/:cajaId/apartado?clienteId=N`
**Rol:** `CAJERO`, `ADMIN_SISTEMA`

1. Verificar sesión activa.
2. Buscar apartado por número en la sucursal.
3. Verificar estado `disponible`.
4. Calcular `fechaFin = fechaInicio + meses` via `calcularFechaVencimiento`.
5. Calcular precio: `calcularPrecioPorMeses(TARIFA_ANUAL, meses)` → `calcularIvaApartado(precio, '19', true)`.
6. Contratar apartado en BD (estado → `ocupado`).
7. Registrar movimiento caja tipo `apartado_postal`.

**Retorna:** `{ apartado, movimiento, saldoActual, alertas }`

---

#### Consultar disponibles
**Endpoint:** `GET /ventas/apartados/disponibles?sucursalId=N&tamano=pequeno|mediano|grande`

Devuelve apartados disponibles enriquecidos con `diasRestantes` y flag `alertaVencimiento`.

---

#### Admin CRUD de apartados
**Roles:** `ADMIN_SISTEMA`, `ADMIN_NACIONAL`

| Endpoint | Operación |
|---|---|
| `GET /ventas/admin/apartados` | Listar (filtros: sucursalId, estado, tamano) |
| `POST /ventas/admin/apartados` | Crear (sucursal, número, tamano, diasAlerta) |
| `PATCH /ventas/admin/apartados/:id` | Actualizar estado, tamano o diasAlerta |
| `DELETE /ventas/admin/apartados/:id` | Eliminar (solo si no está `ocupado`) |

---

### F-V3 · Guías Postales (Envíos)

#### Cotizar tarifa
**Endpoint:** `GET /ventas/servicios-postales/cotizar`

Calcula:
- `pesoVolumetrico = (alto × ancho × largo) / factorVolumetrico`
- `pesoTarificado = max(pesoFisico, pesoVolumetrico)`
- Busca tarifa por `servicioId + pesoTarificado + paisDestino`.
- Calcula `valorKgAdicional` si aplica.

**No requiere sesión de caja.**

---

#### Crear guía
**Endpoint:** `POST /ventas/punto/:cajaId/envio`
**Rol:** `CAJERO`, `ADMIN_SISTEMA`

1. Verificar sesión activa.
2. Cotizar automáticamente.
3. Calcular seguro: `calcularSeguroPostal(valorDeclarado, '0.5')` si aplica.
4. Calcular estampillas requeridas: `calcularValorEstampillasRequeridas(requiereEstampilla, valorServicio, denominaciones)`.
5. Calcular total:
   - Nacional: `calcularTotalEnvioNacional(servicio, estampillas, seguro)`
   - Internacional: `calcularTotalEnvioInternacional(servicio, seguro, estampillas)`
6. Generar número de guía: `generarNumeroGuiaSecuencia('GU', consecutivo)`.
7. Persistir `Envio` en BD.
8. Registrar movimiento caja tipo `venta_servicio`.

**Retorna:** `{ guia, envio, cotizacion, movimiento, saldoActual, alertas }`

---

### F-V4 · Catálogo y consultas

| Endpoint | Descripción |
|---|---|
| `GET /ventas/catalogo/productos?sucursalId=N&tipo=...` | Productos de la sucursal |
| `GET /ventas/catalogo/especiales/:productoId/tarifas` | Tarifas escalonadas por cantidad |
| `GET /ventas/clientes/buscar?tipo=CC&numero=...` | Buscar cliente por documento |
| `GET /ventas/servicios-postales?sucursalId=N` | Servicios postales habilitados |

---

### F-V5 · Resumen del turno

**Endpoint:** `GET /ventas/punto/:cajaId/resumen`
**Endpoint movimientos:** `GET /ventas/punto/:cajaId/turno`

Requiere sesión activa. Retorna totales por tipo de movimiento (sellos, apartados, servicios, productos) para el turno en curso.

---

## Integración Cajas ↔ Ventas ↔ Inventario

```
VentasController
    │
    ▼
VentasService
    ├── cajasService.getSesionActivaByCaja(cajaId)   → obtiene sesionId + sucursalId
    ├── inventarioService.getStock(sucursalId, prod)  → verifica stock
    ├── inventarioService.descontarInventario(...)    → descuenta al confirmar
    ├── inventarioService.restaurarInventario(...)    → restaura al anular
    └── cajasService.registrarMovimientoVenta(...)    → impacta el saldo de caja
```

El `sucursalId` para operaciones de inventario siempre viene de la `SesionCaja` activa, no del cliente ni del request.

---

## Tipos de movimiento de caja

| Tipo | Origen | Efecto |
|---|---|---|
| `apertura` | Apertura sesión | Entrada |
| `cambio_custodia_in` | Apertura auxiliar / cierre auxiliar | Entrada |
| `cambio_custodia_out` | Apertura auxiliar / cierre auxiliar | Salida |
| `venta_producto` | Confirmar venta (productos físicos) | Entrada |
| `venta_estampilla` | Confirmar venta (estampillas/filatelia) | Entrada |
| `venta_servicio` | Confirmar venta (servicios especiales / envíos) | Entrada |
| `apartado_postal` | Contratar apartado | Entrada |
| `anulacion_venta` | Anular venta | Salida |
| `consignacion_aprobada` | Aprobar consignación | Entrada |
| `pago_administrativo` | Pago admin (RETEICA, etc.) | Salida |
| `sobrante_caja` | Diferencia de cierre | Entrada (pendiente aprobación) |
| `faltante_caja` | Diferencia de cierre | Salida (pendiente aprobación) |
| `cierre` | Cierre de sesión | Registro contable |

---

## Cálculos de dominio — ubicación

### `src/cajas/domain/calculos/`

| Archivo | Función |
|---|---|
| `base-apertura.ts` | Monto inicial al abrir principal/auxiliar |
| `cambio-custodia.ts` | Débito/crédito en transferencia entre sesiones |
| `capacidad-punto.ts` | Cuántas auxiliares puede abrir el punto |
| `cierre-sesion.ts` | Arqueo por denominaciones |
| `cierre-forzado.ts` | ¿El turno superó el límite de horas? |
| `consolidado-comercio.ts` | Suma de regionales → total comercio |
| `diferencia-saldo.ts` | Sobrante / faltante de cuadre |
| `pago-administrativo-calc.ts` | Movimiento de pago admin |
| `panel-status-punto.ts` | Composición del panel de status |
| `saldo-por-medio-pago.ts` | Desglose por medio de pago (efectivo, tarjeta…) |
| `consignacion.ts` | Validación + impacto al aprobar |

### `src/regionales/domain/calculos/`

| Archivo | Función |
|---|---|
| `consolidado-regional.ts` | Suma de sucursales → total regional |

### `src/ventas/domain/calculos/`

| Archivo | Función |
|---|---|
| `peso-volumetrico.ts` | Peso vol = (a×b×c) / factor |
| `peso-facturado.ts` | max(físico, volumétrico) |
| `validar-peso-maximo.ts` | Límite de peso por servicio |
| `kg-adicional.ts` | Cargo por kilos sobre el máximo |
| `valor-servicio-total.ts` | Tarifa base + kg adicional |
| `seguro-postal.ts` | 0.5% del valor declarado |
| `total-envio-nacional.ts` | Servicio + estampillas + seguro |
| `total-envio-internacional.ts` | Servicio + seguro + estampillas |
| `estampillas-requeridas.ts` | Denominaciones a usar para cubrir tarifa |
| `numero-guia-secuencia.ts` | Formato GU-XXXXXXX |
| `fecha-vencimiento.ts` | fechaInicio + N meses |
| `precio-por-meses.ts` | Tarifa anual prorrateada |
| `iva-apartado.ts` | Precio base + IVA 19% |
| `dias-para-vencer.ts` | Días restantes a fechaFin |
| `alerta-vencimiento.ts` | ¿Quedan menos de N días? |
| `precio-por-cantidad.ts` | Precio escalonado por rango |
| `anulacion-venta.ts` | Movimiento de reversa para caja |

### `src/inventario/domain/calculos/`

| Archivo | Función |
|---|---|
| `stock-disponible.ts` | Stock disponible descontando reservas |
| `inventario-especial.ts` | Reglas de stock mínimo para servicios especiales |

---

## Pendientes / Trabajo futuro

- **Giros nacionales e internacionales**: mencionados en transcripciones pero no implementados aún. Usarán el mismo flujo de `crearEnvio` con tipo diferente.
- **Sacas**: operación de consolidación de correo saliente. Sin implementar.
- **Preporteado**: modalidad de pago diferido. Sin implementar.
- **Listas restrictivas**: validación de destinatarios contra listas OFAC/UN. Sin implementar.
- **Renovación de apartado**: el método `renovarApartado` existe en el repositorio pero no tiene endpoint ni caso de uso en el servicio.
- **Diferencias pendientes de aprobación**: los movimientos `sobrante_caja` / `faltante_caja` se registran automáticamente en los cierres, pero el flujo de aprobación por tesorería no tiene endpoint dedicado — actualmente usa `registrarDiferencia` manualmente.
