# Feature Flags y CanGuard — arquitectura, segmentación e integración

Reporte de los cambios hechos para dotar a `apps/server` de feature flags con segmentación real (rol/usuario), separar esa lógica de la autorización por permisos ("can"), y exponerlo en `frontend472` como **Configuraciones → Módulos**.

---

## 1. Dos reglas de negocio distintas — por qué se separaron

Al principio existía un único guard (`CanGuard`) que mezclaba tres cosas: rol, permiso y feature flag, con lógica AND/OR combinada. Se corrigió porque **son preguntas distintas**:

| Pregunta | Guard | Decorador | Qué responde |
|---|---|---|---|
| ¿Está el módulo encendido? | `FeatureFlagGuard` | `@Feature('codigo')` | Operación/rollout — kill-switch, mantenimiento, segmentación por rol/usuario/ambiente |
| ¿Puede este usuario hacer esto? | `CanGuard` | `@Can({ rol?, permiso? })` | Autorización — rol exacto y/o permiso granular del JWT |

Se combinan **apilando ambos guards**, no mezclándolos en uno:

```ts
@UseGuards(JwtAuthGuard, FeatureFlagGuard, CanGuard)
@Feature('modulo_facturacion')
@Can({ permiso: 'facturacion:crear' })
@Post('facturas')
crear() { ... }
```

NestJS evalúa los guards en orden y los combina con AND: si el módulo está apagado, `FeatureFlagGuard` corta con **503** antes de que `CanGuard` siquiera se ejecute. Si el módulo está encendido pero el usuario no tiene el permiso, `CanGuard` corta con **403**. El código HTTP ya le dice al frontend cuál de las dos reglas falló, sin necesidad de parsear el mensaje.

`ADMIN_SISTEMA` sortea ambas reglas siempre (puede entrar a un módulo en mantenimiento para verificarlo, y tiene todos los permisos).

Archivos:
- `apps/server/src/common/decorators/feature.decorator.ts` / `common/guards/feature-flag.guard.ts` (nuevo)
- `apps/server/src/common/decorators/can.decorator.ts` / `common/guards/can.guard.ts` (simplificado, ya no depende de `FeatureFlagsService`)

---

## 2. Arquitectura hexagonal de `feature-flags/`

```
feature-flags/
├── domain/
│   ├── feature-flag.entity.ts       ← id, codigo, descripcion, activo, entorno, roles[], usuarios[]
│   ├── feature-flags.errors.ts      ← FeatureFlagNotFoundError, FeatureFlagCodigoDuplicadoError
│   └── feature-flags.repository.ts  ← puerto: IFeatureFlagsRepository + FEATURE_FLAGS_REPOSITORY
├── application/
│   └── feature-flags.service.ts     ← isActive(), getActivos(), CRUD, asignar/revocar rol y usuario
├── infrastructure/
│   ├── prisma-feature-flags.repository.ts  ← adaptador Prisma
│   ├── feature-flags.controller.ts
│   ├── feature-flags.presenter.ts
│   └── feature-flags-domain.filter.ts
├── dto/feature-flag.dto.ts          ← zod: Create/Update/AssignRol/AssignUsuario
└── feature-flags.module.ts          ← @Global(), liga el puerto al adaptador Prisma
```

`@Global()` en el módulo permite que `FeatureFlagGuard` lo inyecte desde cualquier controller sin que cada módulo tenga que importar `FeatureFlagsModule` explícitamente (mismo patrón que `AuditModule`).

---

## 3. Segmentación — tablas nuevas

El modelo original solo tenía `activo` (bool) + `entorno` (`all|dev|staging|prod`) — cubría "para todos" y "por ambiente", pero no "solo para un rol" ni "solo para ciertos usuarios". Se agregaron dos tablas relacionales (mismo patrón que `RolPermiso`):

```prisma
model FeatureFlagRol {
  feature_flags_idfeature_flags Int
  roles_idroles                 Int
  @@id([feature_flags_idfeature_flags, roles_idroles])
  @@map("feature_flags_roles")
}

model FeatureFlagUsuario {
  feature_flags_idfeature_flags Int
  usuarios_idusuarios           Int
  @@id([feature_flags_idfeature_flags, usuarios_idusuarios])
  @@map("feature_flags_usuarios")
}
```

**Regla de evaluación** (`FeatureFlagsService.aplicaA`, privada):
1. `activo = false` → apagado para todos, sin excepción.
2. `entorno` del flag ≠ `'all'` y no coincide con el entorno del servidor (`NODE_ENV` mapeado a `dev/staging/prod`) → apagado.
3. Si el flag **no** tiene roles ni usuarios asociados → encendido para cualquiera que pasó los pasos 1-2 (comportamiento "para todos", sin cambios respecto a como funcionaba antes).
4. Si el flag **sí** tiene roles y/o usuarios asociados → solo se activa si el rol del usuario está en la lista **o** su id está en la lista (basta con una de las dos).

Esto cubre exactamente los casos pedidos:
- **Para todos** → sin roles/usuarios asignados.
- **Solo para administrador** → asignar el rol `ADMIN_SISTEMA` (o `ADMIN_NACIONAL`) al flag.
- **Solo para QA/staging** → usar el campo `entorno` existente (no requiere segmentación).
- **Rollout a una lista de roles/usuarios ("A/B")** → asignar esos roles/usuarios puntuales; el resto no lo ve.

`isActive(codigo, entorno, ctx)` (usado por `FeatureFlagGuard`, backend) y `getActivos(entorno, ctx)` (usado por `GET /feature-flags/activos`, lo que consulta el frontend) aplican la misma regla — el segundo ya filtra la lista de flags "visibles" para que un usuario ni siquiera vea en la respuesta un flag que no le aplica.

### Lo que esto NO cubre (fuera de alcance, ver sección 7)

Un split real de A/B **porcentual** (ej. 50% ve la variante A y 50% la variante B del mismo módulo, no solo on/off) necesita tablas adicionales (`feature_flag_variantes`, opcionalmente `feature_flag_asignaciones` para fijar el bucket de cada usuario). No se implementó — quedó documentado como fase 2 posible.

---

## 4. Auditoría de accesos denegados

Tanto `FeatureFlagGuard` (módulo apagado o fuera de segmentación) como `CanGuard` (sin rol/permiso) registran el intento en `eventos_auditoria` con `accion: 'DENIED'`, usuario, IP y motivo — esto alimenta el panel "Fugas de privilegios" del dashboard de Ciberseguridad ya existente en Grafana (`infra/grafana/dashboards/pos472-ciberseguridad.json`).

---

## 5. API — endpoints nuevos

Todos bajo `/feature-flags`, protegidos con `@Roles('ADMIN_SISTEMA')` salvo el primero:

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/feature-flags/activos?entorno=` | Flags activos para el usuario autenticado (filtrado por segmentación) |
| GET | `/feature-flags` | Listar todos (admin) |
| GET | `/feature-flags/:id` | Detalle |
| POST | `/feature-flags` | Crear (`codigo`, `descripcion?`, `activo`, `entorno`) |
| PATCH | `/feature-flags/:id` | Actualizar |
| DELETE | `/feature-flags/:id` | Eliminar |
| POST | `/feature-flags/:id/roles` `{rolId}` | Segmentar por rol |
| DELETE | `/feature-flags/:id/roles/:rolId` | Quitar segmentación de rol |
| POST | `/feature-flags/:id/usuarios` `{usuarioId}` | Segmentar por usuario |
| DELETE | `/feature-flags/:id/usuarios/:usuarioId` | Quitar segmentación de usuario |

---

## 6. Frontend (`frontend472`) — Configuraciones → Módulos

Se implementó la página `/admin/settings` (antes un placeholder), con `Tabs` y una pestaña **"Módulos"** — deliberadamente separada de la pestaña "Módulos" que ya existe en **Permisos** (esa es otro concepto: agrupación de permisos RBAC, no feature flags; se mantienen en secciones distintas para no generar confusión).

Archivos:
- `src/pages/admin/Settings.tsx` — tabla de flags + `Sheet` de creación/edición + panel de segmentación (checkboxes de rol + buscador de usuario) con toggle inmediato (llama al backend al marcar/desmarcar, sin botón "guardar" aparte para la segmentación).
- `src/queries/feature-flags.queries.ts` — hooks de react-query, mismo patrón que `permisos.queries.ts`.
- `src/types/api.ts` — tipos nuevos con **ids numéricos** (`number`), a propósito distintos de `RolEntry`/`ModuloEntry` (que usan `string`/UUID y no coinciden con el backend real — ver sección 8).
- `src/router.tsx` / `src/components/layout/AppSidebar.tsx` — ruta y entrada de menú "Configuraciones" (ya existía el ítem de menú, solo estaba enlazado a un placeholder).

---

## 7. Migración de base de datos — hallazgo importante

Al aplicar la migración de las tablas nuevas se descubrió que **la base de datos local (`pos_472`) todavía tenía el schema viejo** (ids UUID, columnas en inglés camelCase) mientras que `schema.prisma` en el repo ya describía el schema nuevo aprobado (~41 tablas, ids `Int`, columnas verbosas en español). Es decir, la migración `20260701200820_v1_schema_aprobado` nunca se había aplicado.

Con confirmación explícita del usuario:
1. Se eliminaron 2 carpetas de migración obsoletas, previas al baseline, que bloqueaban cualquier operación de Prisma (`20260627000000_add_roles_permisos`, `20260627000001_add_feature_flags` — referenciaban tablas del schema viejo).
2. Se ejecutó `prisma migrate reset --force` (con consentimiento explícito registrado vía `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`, requerido por una protección propia de Prisma para acciones destructivas invocadas por un agente de IA) — deja la BD limpia con el baseline aprobado.
3. Se corrió `prisma/seed.ts` — repobló roles, usuarios de prueba, 7 feature flags, permisos, etc.
4. Se generó y aplicó la migración `20260701224057_feature_flags_segmentacion` con las 2 tablas nuevas de este trabajo.

**Importante:** esto era estrictamente necesario para que *todo* el backend funcionara (login, auditoría, permisos, no solo feature flags) — antes de este reset, cualquier query de Prisma contra columnas como `idusuarios` habría fallado en runtime contra la BD real, aunque el código compilara sin errores.

---

## 8. Deuda técnica identificada — NO tocada en este trabajo

- `frontend472/src/pages/admin/Permisos.tsx` (pestaña "Módulos") y `queries/permisos.queries.ts` (`useModulos`, `useCreateModulo`, etc.) asumen una tabla `Modulo` independiente con `id/nombre/orden/activo` que **no existe** en el backend real (`Permiso.modulopermisos` es solo un string). Esto ya estaba así, sin commitear, antes de esta sesión — no se tocó.
- `frontend472/src/pages/admin/Users.tsx`, `Permisos.tsx` y `router.tsx` tienen ~10 errores de TypeScript preexistentes (`exactOptionalPropertyTypes`, imports sin usar, una opción de `react-router` obsoleta) — confirmados como preexistentes (con `git stash` no desaparecen). No se tocaron por estar fuera del alcance pedido.
- Los tipos `UserResponse.id`, `RolEntry.id`, etc. están tipados `string` (UUID) en el frontend pero el backend real usa `number`. Los tipos nuevos de este trabajo (`FeatureFlagResponse`, `RolDisponible`) se definieron correctamente en `number` para no propagar el problema, y `feature-flags.queries.ts` usa su propio `useRolesDisponibles()` en vez de reutilizar el `useRoles()` desactualizado de `permisos.queries.ts`.

## 9. Próximos pasos posibles (no implementados)

- A/B real por porcentaje con variantes (`feature_flag_variantes` + opcionalmente `feature_flag_asignaciones` para fijar el bucket de cada usuario y no invalidar el experimento si cambian los porcentajes a mitad de camino).
- Alerta de Grafana sobre el panel "Accesos denegados" para detectar abuso o mala configuración temprano.
- Aplicar `@Feature(...)`/`@Can(...)` a controllers reales existentes (deliberadamente no se hizo — es una decisión por módulo del equipo, y aplicar `@Feature` a un módulo sin flag creado primero lo apagaría para todos menos ADMIN_SISTEMA).
