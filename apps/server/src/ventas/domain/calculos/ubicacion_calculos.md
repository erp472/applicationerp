# Mapa de Cálculos Python → TypeScript — Proyecto 4-72 POS

**Generado:** 2026-07-28  
**Actualizado:** 2026-07-31 (bugs #9-#13,#17 + integraciones sesión 2-3)

**Fuentes leídas:**
- `ventas/application/ventas.service.ts`
- `ventas/domain/business-rules.ts`
- `cajas/application/cajas.service.ts`
- `cajas/domain/business-rules.ts`
- `ventas/infrastructure/prisma-ventas.repository.ts` (L490–530)
- `inventario/inventario.service.ts`
- `regionales/application/regionales.service.ts`
- `sucursales/application/sucursales.service.ts`

---

## Resumen de estado

| Estado           | Cantidad |
|------------------|----------|
| implementado     | 57       |
| parcial          | 10       |
| pendiente        | 29       |
| bug (corregido)  | 14       |
| bug (pendiente)  | 4 (requieren schema) |
| **Total**        | **107**  |

**Cobertura Python:** 505 pruebas — 505 pasan (0.23 s)

---

## Plan de acción — Prioridades de integración

### PRIORIDAD 1 — Módulos 100% pendientes (crear desde cero)
| Módulo NestJS | Sección Python | Funciones pendientes | Schema Prisma |
|---------------|---------------|----------------------|---------------|
| `giros/`      | 11. giros     | 11/11                | `Giro` ✅      |
| `recaudos/`   | 12. recaudos  | 3/3                  | `Recaudo`, `ConvenioRecaudo` ✅ |

### PRIORIDAD 2 — Bugs que requieren cambio de schema
| Bug # | Descripción | Módulo | Schema afectado |
|-------|-------------|--------|-----------------|
| #4    | Precio apartado 87_500 hardcodeado | ventas | `ApartadoPostal.precio` o `TarifaApartado` |
| #5    | `incluyeIva: false` hardcodeado | ventas | `ApartadoPostal.incluyeIva` |
| #6    | Precio no escala por meses | ventas | `ApartadoPostal.precioPorMes` |
| #11   | `dto.sucursalId ?? 0` puede buscar sucursal 0 | ventas | validación obligatoria |
| #16   | `contratarApartado()` no genera Venta/Factura | ventas | relación `ApartadoPostal ↔ Venta` |

### PRIORIDAD 3 — Bugs pendientes sin cambio de schema
| Bug # | Descripción | Archivo TS | Estado |
|-------|-------------|------------|--------|
| #9    | Seguro postal hardcodeado al 0.5% | `ventas.service.ts` | pendiente (requiere campo en Servicio o DTO) |

### Bugs resueltos (sesiones 2-3, 2026-07-30/31)
| Bug # | Descripción | Archivo TS | Estado |
|-------|-------------|------------|--------|
| #2    | `valorEstampillas` no se sumaba en `valorTotal` | `ventas.service.ts` | **corregido** — usa `calcularTotalEnvioNacional` |
| #7+#8 | `tipo_cliente` y `ciudad_destino` ignorados | `tarifa-nacional.ts`, `prisma-ventas.repository.ts` | **corregido** |
| #10   | Número guía con timestamp, no secuencia DB | `ventas.service.ts`, repo | **corregido** — `nextConsecutivoGuia()` |
| #11   | `dto.sucursalId ?? 0` en contratarApartado | `ventas.service.ts` | **corregido** — usa `sesion.sucursalId` |
| #12   | Sin error cuando ningún tramo de tarifa aplica | `ventas.service.ts` | **corregido** — `calcularPrecioPorCantidad` lanza |
| #13   | Descuento sin validación (subtotal negativo) | `subtotal-linea.ts` | **corregido** — ya lanzaba; test arreglado |
| #17   | `diasAlertaVencimiento` nunca evalúa | `ventas.service.ts` | **corregido** — `_enriquecerApartado()` |

### PRIORIDAD 4 — Funciones parciales críticas
| Sección | Función | Archivo TS | Gap |
|---------|---------|------------|-----|
| caja_principal | `saldo_por_medio_pago` | `cajas/domain/business-rules.ts` | no existe |
| consignaciones | `validar_monto_consignacion` | `cajas/domain/business-rules.ts` | valida estado, no monto |
| diferencias | `moneda_circulante` | `cajas.service.ts:114–129` | acumulado no calculado correctamente |
| diferencias | `arqueo_denominaciones` | `cajas.service.ts:318–324` | parcial |
| caja_auxiliar | `cierre_forzado` | `cajas.service.ts:260` | sin distinción vs normal |
| apartado_postal | `dias_para_vencer` | no existe | pendiente |
| apartado_postal | `renovacion_apartado` | no existe | pendiente |
| servicios_postales | `valida_preporteado` | no existe | pendiente |
| servicios_postales | `preporteado` | no existe | pendiente |
| servicios_postales | `mixto_preporteado` | no existe | pendiente |
| servicios_postales | `eco_comercial` | no existe | pendiente |
| servicios_postales | `tiempo_entrega_estimado` | no existe | pendiente |
| servicios_internacionales | `conversion_moneda` | no existe | pendiente |
| servicios_internacionales | `impuestos_aduana_destino` | no existe | pendiente |
| servicios_internacionales | `guia_cp_validacion` | no existe | pendiente |
| facturacion | `retencion_fuente` | no existe | pendiente |
| facturacion | `numero_factura` | no existe | pendiente |
| facturacion | `cufe_electronica` | no existe | pendiente |

---

## Bugs corregidos (2026-07-28)

| Bug # | Archivo(s) Python | Descripción | Corrección aplicada | Archivo TS |
|-------|-------------------|-------------|---------------------|------------|
| #1    | `descomponer_iva`, `total_carrito`, `descomponer_iva_especial`, `iva_venta` | IVA calculado sobre precio bruto; debe ser `bruto × t/(100+t)` | `calcularTotalesCarrito`: `iva = bruto × t/(100+t)`, total sin doble IVA | `ventas/domain/business-rules.ts` |
| #2    | `valor_estampillas_requeridas` | `denominacionesDisponibles: []` → crash en servicios con estampilla | `findEstampillasConStock(sucursalId)` en repo; `crearEnvio` lo llama si `requiereEstampilla` | `prisma-ventas.repository.ts`, `ventas.service.ts` |
| #3    | `kg_adicional` | `kgExtra` calculado desde piso del tramo (`pesoMinKg`) no desde el techo | `cotizarEnvio`: usa `tarifa.pesoMaxKg` como base | `ventas/application/ventas.service.ts` |
| #7+#8 | `tarifa_nacional` | `ciudad_destino` ignorado en lookup de tarifa | `findTarifaEnvio(ciudadDestino?)`: busca específica, fallback a null; `cotizarEnvio` y `crearEnvio` pasan `ciudadDestino` | `prisma-ventas.repository.ts`, `ventas.service.ts`, `ventas.controller.ts` |
| #14   | `validar_producto_activo_sucursal` | `findProductoById()` sin pasar `sucursalId` → no valida si producto activo en la sucursal | `agregarProducto`: pasa `sesion.sucursalId` a `findProductoById` | `ventas/application/ventas.service.ts` |
| #15   | `validar_peso_maximo` | Sin validación de peso máximo en `cotizarEnvio()` | Lanza error si `pesoTarificado > servicio.pesoMaximoKg` | `ventas/application/ventas.service.ts` |
| N/A   | optimización | `_recalcularTotales` hacía N queries extra | Usa `d.porcentajeTax` del detalle, elimina queries extra | `ventas/application/ventas.service.ts` |

---

## 1. jerarquia

Rutas TS relativas desde `src/`. Rutas Python relativas desde `src/calculos/`.

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `jerarquia/consolidado_regional.py` | regionales | `regionales/application/regionales.service.ts` | 53 | `findAll()` con meta de paginación | parcial |
| `jerarquia/consolidado_comercio.py` | cajas | `cajas/application/cajas.service.ts` | 532 | `getPanelAdmin(regionalId?)` | parcial |
| `jerarquia/sucursales_activas_por_regional.py` | regionales | `regionales/application/regionales.service.ts` | 68–71 | `countActiveSucursales()` vía repo (interno a update/remove) | parcial |
| `jerarquia/cajas_habilitadas_por_sucursal.py` | cajas | `cajas/application/cajas.service.ts` | 45 | `listCajas(sucursalId)` | implementado |
| `jerarquia/capacidad_punto.py` | cajas | `cajas/application/cajas.service.ts` | 114 | `getStatusPunto(cajaPadreId)` | parcial |

---

## 2. caja_principal

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `caja_principal/base_apertura_principal.py` | cajas | `cajas/application/cajas.service.ts` | 153 | `abrirTurnoPrincipal()` — campo `montoApertura` | implementado |
| `caja_principal/saldo_caja_principal.py` | cajas | `cajas/application/cajas.service.ts` | 131–143 | `getSaldoSesion()` → `sesionesRepo.calcularSaldo()` | implementado |
| `caja_principal/saldo_por_medio_pago.py` | cajas | `cajas/domain/business-rules.ts` | no existe | **pendiente** | pendiente |
| `caja_principal/saldo_caja_fuerte_general.py` | cajas | `cajas/application/cajas.service.ts` | 114–129 | `getStatusPuntoBySucursal()` — campo `cajaFuerteGeneral` en panel | parcial |
| `caja_principal/panel_status_punto.py` | cajas | `cajas/application/cajas.service.ts` | 114–129 | `getStatusPunto()` / `getStatusPuntoBySucursal()` | implementado |
| `caja_principal/limite_efectivo_alerta.py` | cajas | `cajas/domain/business-rules.ts` | 43–53 | `evaluarAlertas()` — alerta `limite_efectivo_caja` | implementado |
| `caja_principal/traslado_caja_fuerte.py` | cajas | `cajas/application/cajas.service.ts` | 328–368 | `cambioCustodia()` | implementado |
| `caja_principal/hora_reset_turno.py` | cajas | `cajas/application/cajas.service.ts` | 91–98 | `createCajaPadre()` — campo `horaReset` | parcial |
| `caja_principal/cierre_turno_principal.py` | cajas | `cajas/application/cajas.service.ts` | 445–486 | `cerrarTurnoPrincipal()` | implementado |
| `caja_principal/diferencia_cierre_principal.py` | cajas | `cajas/application/cajas.service.ts` | 459–476 | dentro de `cerrarTurnoPrincipal()` — cálculo diferencia | implementado |
| `caja_principal/arqueo_denominaciones.py` | cajas | `cajas/application/cajas.service.ts` | 480–485 | `cerrarSesion()` con campo `arqueo: dto.denominaciones` | parcial |

---

## 3. caja_auxiliar

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `caja_auxiliar/base_asignada_auxiliar.py` | cajas | `cajas/application/cajas.service.ts` | 209–256 | `abrirAuxiliar()` — campo `dto.baseAsignada` | implementado |
| `caja_auxiliar/debito_principal_por_apertura.py` | cajas | `cajas/application/cajas.service.ts` | 231–238 | dentro de `abrirAuxiliar()` — movimiento `cambio_custodia_out` | implementado |
| `caja_auxiliar/credito_auxiliar_por_apertura.py` | cajas | `cajas/application/cajas.service.ts` | 239–244 | dentro de `abrirAuxiliar()` — movimiento `cambio_custodia_in` | implementado |
| `caja_auxiliar/saldo_caja_auxiliar.py` | cajas | `cajas/application/cajas.service.ts` | 131–143 | `getSaldoSesion()` — mismo método, aplica a cualquier sesión | implementado |
| `caja_auxiliar/alerta_reposicion.py` | cajas | `cajas/domain/business-rules.ts` | 43–53 | `evaluarAlertas()` — alerta `reposicion_caja` | implementado |
| `caja_auxiliar/cambio_custodia_mid_turno.py` | cajas | `cajas/application/cajas.service.ts` | 328–368 | `cambioCustodia()` | implementado |
| `caja_auxiliar/reposicion_caja.py` | cajas | `cajas/application/cajas.service.ts` | 328–368 | `cambioCustodia()` + `crearReposicion()` | implementado |
| `caja_auxiliar/cierre_auxiliar.py` | cajas | `cajas/application/cajas.service.ts` | 260–324 | `cerrarAuxiliar()` | implementado |
| `caja_auxiliar/devolucion_a_principal.py` | cajas | `cajas/application/cajas.service.ts` | 283–305 | dentro de `cerrarAuxiliar()` — movimiento `cambio_custodia_in` en `sesionGeneral` | implementado |
| `caja_auxiliar/cierre_forzado.py` | cajas | `cajas/application/cajas.service.ts` | 260 | `cerrarAuxiliar()` — sin distinción de cierre forzado vs normal | parcial |
| `caja_auxiliar/pago_administrativo.py` | cajas | `cajas/application/cajas.service.ts` | 430–441 | `registrarPagoAdministrativo()` | implementado |

---

## 4. consignaciones

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `consignaciones/registro_consignacion.py` | cajas | `cajas/application/cajas.service.ts` | 373–389 | `registrarConsignacion()` | implementado |
| `consignaciones/impacto_consignacion_aprobada.py` | cajas | `cajas/application/cajas.service.ts` | 391–411 | `aprobarConsignacion()` — registra movimiento tipo `consignacion` | implementado |
| `consignaciones/rechazo_consignacion.py` | cajas | `cajas/application/cajas.service.ts` | 391–411 | dentro de `aprobarConsignacion()` — estado `rechazada` | implementado |
| `consignaciones/validar_monto_consignacion.py` | cajas | `cajas/domain/business-rules.ts` | 37–40 | `validarConsignacionPendiente()` — valida estado, **no monto** | parcial |

---

## 5. diferencias

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `diferencias/diferencia_faltante.py` | cajas | `cajas/application/cajas.service.ts` | 308–316 | dentro de `cerrarAuxiliar()` — tipo `diferencia_faltante` | implementado |
| `diferencias/diferencia_sobrante.py` | cajas | `cajas/application/cajas.service.ts` | 308–316 | dentro de `cerrarAuxiliar()` — tipo `diferencia_sobrante` | implementado |
| `diferencias/impacto_diferencia_aprobada.py` | cajas | `cajas/application/cajas.service.ts` | 415–426 | `registrarDiferencia()` | implementado |
| `diferencias/moneda_circulante.py` | cajas | `cajas/application/cajas.service.ts` | 114–129 | `getStatusPunto()` — campo `acumuladoMonedaCirculante` en panel | parcial |
| `diferencias/arqueo_denominaciones.py` | cajas | `cajas/application/cajas.service.ts` | 318–324 | `cerrarSesion()` con campo `arqueo: dto.denominaciones` | parcial |

---

## 6. productos

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `productos/precio_cliente.py` | ventas | `ventas/application/ventas.service.ts` | 124 | dentro de `agregarProducto()` — `precioUnitario = producto.precio` | implementado |
| `productos/descomponer_iva.py` | ventas | `ventas/domain/business-rules.ts` | 35–55 | `calcularTotalesCarrito()` | **corregido** (#1) |
| `productos/descuento_volumen.py` | ventas | `ventas/application/ventas.service.ts` | 125–133 | dentro de `agregarProducto()` — lookup tarifa por rango de cantidad | parcial |
| `productos/subtotal_linea.py` | ventas | `ventas/domain/business-rules.ts` | 30–32 | `calcularSubtotalDetalle()` | bug (#13) |
| `productos/total_carrito.py` | ventas | `ventas/domain/business-rules.ts` | 35–55 | `calcularTotalesCarrito()` | **corregido** (#1) |
| `productos/stock_disponible.py` | inventario | `inventario/inventario.service.ts` | 43–125 | `listStock()` — campo `stockActual` | implementado |
| `productos/alerta_stock_minimo.py` | inventario | `inventario/inventario.service.ts` | 84–98 | `mapItem()` — campo `estado: 'bajo' \| 'critico'` | implementado |
| `productos/redondeo_moneda.py` | ventas | `ventas/domain/business-rules.ts` | 50–54 | `calcularTotalesCarrito()` — `Math.round()` en totales | implementado |

---

## 7. servicios_especiales

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `servicios_especiales/precio_por_cantidad.py` | ventas | `ventas/application/ventas.service.ts` | 125–133 | dentro de `agregarProducto()` — `tarifas.find(t => cantidad in range)` | bug (#12) |
| `servicios_especiales/validar_limites_cantidad.py` | ventas | `ventas/application/ventas.service.ts` | 115–122 | dentro de `agregarProducto()` — validación `cantidadMinima/cantidadMaxima` | implementado |
| `servicios_especiales/validar_producto_activo_sucursal.py` | ventas | `ventas/application/ventas.service.ts` | 111 | `repo.findProductoById()` — sin validación `ProductoSucursal.activo` | bug (#14) |
| `servicios_especiales/subtotal_servicio_especial.py` | ventas | `ventas/domain/business-rules.ts` | 30–32 | `calcularSubtotalDetalle()` | implementado |
| `servicios_especiales/descomponer_iva_especial.py` | ventas | `ventas/domain/business-rules.ts` | 35–55 | `calcularTotalesCarrito()` | **corregido** (#1) |
| `servicios_especiales/impacto_inventario_especial.py` | ventas | `ventas/application/ventas.service.ts` | 189–210 | dentro de `confirmarVenta()` — `repo.descontarInventario()` | implementado |
| `servicios_especiales/restaurar_inventario_especial.py` | ventas | `ventas/application/ventas.service.ts` | 259–268 | dentro de `anularVenta()` — `repo.restaurarInventario()` | implementado |
| `servicios_especiales/tipo_movimiento_caja_especial.py` | ventas | `ventas/application/ventas.service.ts` | 520–525 | `_resolverTipoMovimiento()` | implementado |

---

## 8. apartado_postal

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `apartado_postal/tarifa_apartado_parametrizable.py` | ventas | `ventas/application/ventas.service.ts` | 311, 317 | `PRECIO_APARTADO_POSTAL = 87_500` — constante hardcodeada | bug (#4, #11) requiere-schema |
| `apartado_postal/precio_por_meses.py` | ventas | `ventas/application/ventas.service.ts` | 336 | `monto: PRECIO_APARTADO_POSTAL` — precio no escala por `dto.meses` | bug (#6) requiere-schema |
| `apartado_postal/iva_apartado.py` | ventas | `ventas/application/ventas.service.ts` | 337 | `incluyeIva: false` — hardcodeado, contradice schema | bug (#5) requiere-schema |
| `apartado_postal/fecha_vencimiento.py` | ventas | `ventas/application/ventas.service.ts` | 324–327 | dentro de `contratarApartado()` — `fechaFin.setMonth(getMonth + meses)` | implementado |
| `apartado_postal/dias_para_vencer.py` | ventas | no existe | — | **pendiente** | pendiente |
| `apartado_postal/alerta_vencimiento_apartado.py` | ventas | `ventas/application/ventas.service.ts` | 363–364 | `createApartadoAdmin()` — almacena `diasAlertaVencimiento` sin usarlo | bug (#17) |
| `apartado_postal/renovacion_apartado.py` | ventas | no existe | — | **pendiente** | pendiente |
| `apartado_postal/disponibilidad_apartados.py` | ventas | `ventas/application/ventas.service.ts` | 303 | `getApartadosDisponibles()` → `repo.findApartadosDisponibles()` | implementado |
| `apartado_postal/factura_apartado.py` | ventas | `ventas/application/ventas.service.ts` | 313–348 | `contratarApartado()` — sin generar `Venta/Factura` asociada | bug (#16) requiere-schema |

---

## 9. servicios_postales

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `servicios_postales/peso_volumetrico.py` | ventas | `ventas/application/ventas.service.ts` | 385–387 | dentro de `cotizarEnvio()` | implementado |
| `servicios_postales/peso_facturado.py` | ventas | `ventas/application/ventas.service.ts` | 389–392 | dentro de `cotizarEnvio()` — `Math.max(pesoFisico, pesoVolumetrico)` | implementado |
| `servicios_postales/validar_peso_maximo.py` | ventas | `ventas/application/ventas.service.ts` | 381–410 | — | **corregido** (#15) |
| `servicios_postales/tarifa_nacional.py` | ventas | `ventas/application/ventas.service.ts` | 393–394 | `repo.findTarifaEnvio()` — ignora `tipo_cliente` y `ciudad_destino` | bug (#7, #8) |
| `servicios_postales/kg_adicional.py` | ventas | `ventas/application/ventas.service.ts` | 397–399 | dentro de `cotizarEnvio()` | **corregido** (#3) |
| `servicios_postales/valor_servicio_total.py` | ventas | `ventas/application/ventas.service.ts` | 396–401 | dentro de `cotizarEnvio()` | parcial (deps #7, #8) |
| `servicios_postales/valor_estampillas_requeridas.py` | ventas | `ventas/application/ventas.service.ts` | 466 | `valorEstampillas: 0` hardcodeado en `crearEnvio()` | bug (#2) |
| `servicios_postales/valida_preporteado.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_postales/preporteado.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_postales/mixto_preporteado.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_postales/seguro_postal.py` | ventas | `ventas/application/ventas.service.ts` | 425–427 | `valorSeguro = Math.round(valorDeclarado * 0.005)` hardcodeado | bug (#9) |
| `servicios_postales/eco_comercial.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_postales/total_envio_nacional.py` | ventas | `ventas/application/ventas.service.ts` | 428 | `valorTotal = valorServicio + valorSeguro` | implementado |
| `servicios_postales/numero_guia_secuencia.py` | ventas | `ventas/application/ventas.service.ts` | 514–517 | `_generarNumeroGuia()` — timestamp+random, no secuencia DB | bug (#10) |
| `servicios_postales/tiempo_entrega_estimado.py` | ventas | no existe | — | **pendiente** | pendiente |

---

## 10. servicios_internacionales

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `servicios_internacionales/peso_volumetrico_intl.py` | ventas | `ventas/application/ventas.service.ts` | 385–387 | dentro de `cotizarEnvio()` — misma lógica para internacionales | implementado |
| `servicios_internacionales/tarifa_internacional_ms.py` | ventas | `ventas/application/ventas.service.ts` | 393–394 | `repo.findTarifaEnvio()` filtrado por `paisDestino` | parcial |
| `servicios_internacionales/tarifa_internacional_courier.py` | ventas | `ventas/application/ventas.service.ts` | 393–394 | `repo.findTarifaEnvio()` filtrado por `paisDestino` | parcial |
| `servicios_internacionales/conversion_moneda.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_internacionales/impuestos_aduana_destino.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_internacionales/validar_valor_declarado_intl.py` | ventas | `ventas/application/ventas.service.ts` | 381–410 | `cotizarEnvio()` — sin validación de valor declarado máximo | pendiente |
| `servicios_internacionales/guia_cp_validacion.py` | ventas | no existe | — | **pendiente** | pendiente |
| `servicios_internacionales/total_envio_internacional.py` | ventas | `ventas/application/ventas.service.ts` | 428 | `valorTotal = valorServicio + valorSeguro` — sin impuestos aduana | parcial |

---

## 11. giros

> **Módulo 100% pendiente** — schema `Giro` existe en Prisma. Crear `src/giros/` desde cero.

| Archivo Python | Módulo NestJS | Archivo TS | Estado |
|----------------|--------------|------------|--------|
| `giros/flete_giro_nacional.py` | giros | no existe | pendiente |
| `giros/total_giro_nacional.py` | giros | no existe | pendiente |
| `giros/conversion_giro_internacional.py` | giros | no existe | pendiente |
| `giros/comision_giro_internacional.py` | giros | no existe | pendiente |
| `giros/total_giro_internacional.py` | giros | no existe | pendiente |
| `giros/giro_incluye_flete.py` | giros | no existe | pendiente |
| `giros/validacion_lista_restrictiva.py` | giros | no existe | pendiente |
| `giros/pin_giro_nacional.py` | giros | no existe | pendiente |
| `giros/pin_giro_internacional.py` | giros | no existe | pendiente |
| `giros/impacto_caja_giro_pago.py` | ventas/cajas | no existe | pendiente |
| `giros/impacto_caja_giro_emision.py` | ventas/cajas | no existe | pendiente |

---

## 12. recaudos

> **Módulo 100% pendiente** — schemas `Recaudo` + `ConvenioRecaudo` + `ConvenioSucursal` existen en Prisma. Crear `src/recaudos/` desde cero.

| Archivo Python | Módulo NestJS | Archivo TS | Estado |
|----------------|--------------|------------|--------|
| `recaudos/convenio_activo_sucursal.py` | recaudos | no existe | pendiente |
| `recaudos/valor_recaudo.py` | recaudos | no existe | pendiente |
| `recaudos/impacto_caja_recaudo.py` | ventas/cajas | no existe | pendiente |

---

## 13. facturacion

| Archivo Python | Módulo NestJS | Archivo TS | Línea aprox. | Función TS equivalente | Estado |
|----------------|--------------|------------|--------------|------------------------|--------|
| `facturacion/base_gravable.py` | ventas | `ventas/domain/business-rules.ts` | 41–43 | dentro de `calcularTotalesCarrito()` — `neto = base - desc` | parcial |
| `facturacion/iva_venta.py` | ventas | `ventas/domain/business-rules.ts` | 44 | `iva += neto * (porcentajeTax / 100)` | **corregido** (#1) |
| `facturacion/descuento_total_venta.py` | ventas | `ventas/domain/business-rules.ts` | 43, 52 | `calcularTotalesCarrito()` — acumula descuento | implementado |
| `facturacion/total_venta.py` | ventas | `ventas/domain/business-rules.ts` | 53 | `total = subtotal - descuento + iva` | implementado |
| `facturacion/retencion_fuente.py` | ventas | no existe | — | **pendiente** | pendiente |
| `facturacion/redondeo_factura.py` | ventas | `ventas/domain/business-rules.ts` | 50–53 | `Math.round()` en subtotal, descuento, iva, total | implementado |
| `facturacion/numero_factura.py` | ventas | no existe | — | **pendiente** | pendiente |
| `facturacion/cufe_electronica.py` | ventas | no existe | — | **pendiente** | pendiente |
| `facturacion/anulacion_venta.py` | ventas | `ventas/application/ventas.service.ts` | 247–291 | `anularVenta()` | implementado |

---

## Cobertura de tests Python

| Archivo de test | Tests | Módulos cubiertos |
|-----------------|-------|-------------------|
| `test_jerarquia.py` | 19 | jerarquia (5 funciones) |
| `test_caja_principal.py` | 38 | caja_principal (11 funciones) |
| `test_caja_auxiliar.py` | 45 | caja_auxiliar (11 funciones) |
| `test_consignaciones.py` | 22 | consignaciones (4 funciones) |
| `test_diferencias.py` | 22 | diferencias (5 funciones) |
| `test_productos.py` | 40 | productos (8 funciones) |
| `test_servicios_especiales.py` | 39 | servicios_especiales (8 funciones) |
| `test_apartado_postal.py` | 43 | apartado_postal (9 funciones) |
| `test_servicios_postales.py` | 79 | servicios_postales (15 funciones) |
| `test_servicios_internacionales.py` | 36 | servicios_internacionales (8 funciones) |
| `test_giros.py` | 62 | giros (11 funciones) |
| `test_recaudos.py` | 17 | recaudos (3 funciones) |
| `test_facturacion.py` | 43 | facturacion (9 funciones) |
| **Total** | **505** | — |
