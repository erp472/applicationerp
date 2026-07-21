# Alertas del Sistema 4-72 POS

Fuente: FASE_1_completo.txt (transcripción operativa MultiPay/CiPOS)

---

## Alertas de Caja

| # | Alerta | Disparador | Nivel | Implementado |
|---|--------|-----------|-------|-------------|
| 1 | **Reposición de caja** — el saldo bajó del mínimo (`baseDia`) | Después de cualquier movimiento de salida | Cajero | ✅ `reposicion_caja` en `evaluarAlertas()` |
| 2 | **Límite de efectivo** — el saldo superó el tope parametrizado (`limiteAlerta`) | Después de cualquier ingreso | Cajero | ✅ `limite_efectivo_caja` en `evaluarAlertas()` |
| 3 | **Faltante de caja** — el cajero contó menos de lo que el sistema espera en el cierre | Cierre de caja auxiliar | Supervisor | ✅ `diferencia_faltante` auto-registrado en `cerrarAuxiliar()` |
| 4 | **Sobrante de caja** — el cajero contó más de lo que el sistema espera en el cierre | Cierre de caja auxiliar | Supervisor | ✅ `diferencia_sobrante` auto-registrado en `cerrarAuxiliar()` |
| 5 | **Moneda circulante** — diferencia de redondeo por decimales entre CiPOS y MultiPay | Cierre de caja / reconciliación | Supervisor | ✅ movimiento tipo `moneda_circulante` |
| 6 | **Consignación pendiente de aceptar** — tesorería aprobó y el asesor debe confirmar para disminuir el saldo | Aprobación de consignación en tesorería | Cajero | ⚠️ El movimiento `consignacion` existe pero falta push/alerta en tiempo real |
| 7 | **Anulación de factura pendiente** — supervisor aprobó anulación y afecta el saldo | Aprobación de anulación | Cajero | ⚠️ El movimiento `anulacion` existe; falta el flujo de aprobación por supervisor |

---

## Alertas de Inventario

| # | Alerta | Disparador | Nivel | Implementado |
|---|--------|-----------|-------|-------------|
| 8 | **Stock mínimo** — un producto (estampillas, insumos) llegó al nivel mínimo configurado | Cuando el inventario baja del `stock_minimo` | Supervisor / Almacén | ❌ Pendiente — módulo de inventario |
| 9 | **Inventario recibido** — almacén central cargó inventario al punto; el asesor debe aceptarlo | Despacho de almacén hacia el punto | Cajero | ❌ Pendiente — módulo de inventario |

---

## Notas operativas

- **Faltantes y sobrantes** requieren aprobación del área financiera (tesorería) en el legacy MultiPay antes de que la caja quede cuadrada. En el sistema actual se registran automáticamente; si se quiere el flujo de aprobación habría que agregar `estado: 'pendiente'|'aprobada'` al movimiento de diferencia.
- **Moneda circulante**: ocurre cuando CiPOS envía tarifas con decimales y el sistema redondea al cobrar; la diferencia se registra como movimiento separado.
- **Consignaciones**: cuando el cajero tiene demasiado efectivo hace una consignación bancaria y la registra. Tesorería la verifica contra el banco y la aprueba; en ese momento el saldo del cajero debe disminuir.
- **Cambio de custodia**: no es una alerta sino una transferencia entre sesiones activas (p.ej. caja fuerte → auxiliar cuando le falta efectivo para pagar un giro). ✅ Implementado en `cambioCustodia()`.
