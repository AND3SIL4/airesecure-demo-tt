---
description: "Lista de tareas de la feature 001-fundacion"
---

# Tasks: Fundación de la demo

**Input**: documentos de diseño en `specs/001-fundacion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **no hay tareas de pruebas** (constitución, principio VIII). La validación es manual (última fase).

**Organization**: las tareas se agrupan por historia de usuario y, dentro de cada una, por capas: backend domain → repositories → services → api, y frontend infrastructure → application → presentation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos y sin dependencias pendientes).
- **[Story]**: US1 a US5 de spec.md.

---

## Phase 1: Setup (infraestructura compartida)

**Purpose**: inicializar ambos proyectos y sus herramientas.

- [x] T001 Crear `backend/pyproject.toml` (name `aerosecure-backend`, version `0.1.0`, `requires-python = ">=3.12,<3.13"`, dependencias `fastapi`, `uvicorn[standard]`, `sqlmodel`; dependency-group dev `ruff`; config de ruff con line-length 110, target py312 y reglas E, F, I, UP, B), `backend/.python-version` (`3.12`), `backend/data/.gitkeep` y los paquetes vacíos `backend/app/{__init__,api/__init__,api/routers/__init__,api/schemas/__init__,services/__init__,repositories/__init__,domain/__init__,infrastructure/__init__,infrastructure/seed/__init__}.py`; ejecutar `uv sync` en `backend/`.
- [x] T002 [P] Crear el proyecto frontend con Bun en `frontend/`: `package.json` (scripts `dev: vite`, `build: tsc -b && vite build`, `lint: eslint .`, `preview: vite preview`); dependencias `react@18`, `react-dom@18`, `react-router-dom@7`, `@tanstack/react-query@5`, `lucide-react` y `@fontsource-variable/inter`; devDependencies `vite@6`, `@vitejs/plugin-react`, `typescript@5`, `@types/react@18`, `@types/react-dom@18`, `tailwindcss@4`, `@tailwindcss/vite`, `eslint@9`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` y `globals`. Instalar con `bun install` (sin npm ni node).
- [x] T003 [P] Configurar `frontend/vite.config.ts` (plugins react y tailwindcss; `server: { port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:8000' } }`), `frontend/tsconfig.json`, `tsconfig.app.json` (`strict: true`, `noUncheckedIndexedAccess: true`, jsx react-jsx) y `tsconfig.node.json`, `frontend/eslint.config.js` (flat config con typescript-eslint y react-hooks) y `frontend/index.html` (`lang="es"`, título "AeroSecure AI · Demo").
- [x] T004 [P] Crear la estructura de capas vacía del front: `frontend/src/{domain,infrastructure/api,application/hooks,application/stores,presentation/layout,presentation/components,presentation/pages}/` (con un `.gitkeep` donde haga falta).

---

## Phase 2: Foundational (prerrequisitos bloqueantes)

**Purpose**: el núcleo de backend y frontend que usan todas las historias.

**⚠️ CRITICAL**: ninguna historia empieza antes de completar esta fase.

### Backend
- [x] T005 [P] Crear `backend/app/config.py` con `BASE_DIR`, `DB_PATH = backend/data/aerosecure.db`, `APP_VERSION = "0.1.0"` y `DISPLAY_TZ = "America/Bogota"`.
- [x] T006 [P] Crear `backend/app/domain/enums.py` con los StrEnum `Severity` (`critica`, `alta`, `media`, `baja`), `Role` (`operador`, `supervisor`), `SourceKind` (`camara`, `sensor`, `reporte_manual`, `analisis`), `RiskLevel` (`critica`, `alta`, `media`, `baja`, `normal`) y `DismissReason` (`pertenencia_personal`, `movimiento_normal`, `falla_camara`, `personal_autorizado`, `otro`).
- [x] T007 [P] Crear `backend/app/domain/errors.py` con `DomainError(Exception)` (campos `code`, `message`, `details: dict`, `status: int = 400`) y las constantes de los códigos del doc 08 §1.
- [x] T008 [P] Crear `backend/app/domain/catalogs.py` con las constantes de dominio del doc 05 §4-5: `SEVERITY_WEIGHT`, `SEVERITY_ORDER`, `ZONE_FACTOR` y `DISMISS_REASON_LABELS` (con `otro` → requiresText), y el helper `utcnow()` (datetime aware en UTC).
- [x] T009 Crear `backend/app/domain/models.py` con las tablas SQLModel del data-model.md: `Zone` (id str(16) PK, name str(80), terminal str(8), criticality int "1..3", restricted bool, geom_x/geom_z/geom_w/geom_d/geom_h float), `Source` (id str(16) PK, kind SourceKind, label str(80), zone_id FK zones.id **nullable** "nulo solo para fuentes lógicas"), `AlertType` (code str(32) PK, name str(80), default_severity Severity nullable, scenario_weight int ≥0, confidence_threshold float nullable "0.50..0.99", recommendation text, protocol_json text), `Team` (id, name, specialty, specialized bool), `User` (id str(16), alias str(40), role Role) y `AppSetting` (key str(64) PK, value_json text, updated_at datetime UTC). Nombres de tabla: `zones`, `sources`, `alert_types`, `teams`, `users`, `app_settings`.
- [x] T010 Crear `backend/app/infrastructure/db.py`: el engine SQLite sobre `DB_PATH` con `check_same_thread=False`, un listener `connect` que ejecuta `PRAGMA foreign_keys=ON`, `get_session()` (generador) e `init_db()`, que hace `PRAGMA quick_check`; si falla o la base no abre, la renombra a `aerosecure.db.corrupt-<timestamp>` y luego ejecuta `SQLModel.metadata.create_all(engine)`.
- [x] T011 Crear `backend/app/infrastructure/seed/catalogs.py` con los datos exactos del data-model.md: 10 zonas con su geometría, 15 cámaras, 5 sensores, `MANUAL` y `ANALISIS` (con sus labels), 7 tipos de alerta con recomendación y protocolo, 6 equipos (eod, policia y medico especializados) y 3 usuarios (op-01, op-02, sup-a); y `seed_catalogs(session)` en `backend/app/infrastructure/seed/__init__.py`, que hace `session.merge` de los catálogos e inserta `app_settings` (`simulator.enabled=true`, `simulator.interval_seconds=60`, `thresholds.<code>`) **solo si la clave no existe**.
- [x] T012 [P] Crear `backend/app/api/schemas/base.py` con `ApiModel(BaseModel)`: `ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)`, y el modelo `ErrorBody`.
- [x] T013 Crear `backend/app/api/errors.py` con `register_error_handlers(app)`: `DomainError` → `{error:{code,message,details}}` con su status; `RequestValidationError` → 422 `VALIDACION` con `details.fields=[{field,message}]`; `StarletteHTTPException` 404 → `NO_ENCONTRADO`, y los demás códigos HTTP mapeados con el mismo formato; `Exception` → 500 `ERROR_INTERNO` "Ocurrió un error inesperado." (con log del traceback).
- [x] T014 Crear `backend/app/main.py`: `FastAPI(title="AeroSecure AI API", version=APP_VERSION)`, un `lifespan` que llama a `init_db()` y a `seed_catalogs`, CORS para `http://localhost:5173`, `register_error_handlers` y la inclusión de routers con prefijo `/api` (se irán añadiendo en cada historia).

### Frontend
- [x] T015 [P] Crear `frontend/src/index.css` con `@import "tailwindcss";`, `@import "@fontsource-variable/inter";` y el bloque `@theme` con los tokens del doc 09 §5.1: `--color-navy-950 #0B1B33`, `--color-navy-900 #10264A`, `--color-brand-600 #1D5FD1`, `--color-surface #FFFFFF`, `--color-surface-muted #F3F6FA`, `--color-sev-critica #DC2626`, `--color-sev-alta #EA580C`, `--color-sev-media #D97706`, `--color-sev-baja #475569`, `--color-ok #16A34A`, `--color-demo-bg #FEF3C7` y `--color-demo-fg #92400E`; `--font-sans` Inter variable; números tabulares utilitarios; foco visible global (`:focus-visible` con un anillo brand de 2 px) y `@media (prefers-reduced-motion)` que anula las animaciones.
- [x] T016 [P] Crear `frontend/src/domain/types.ts` (`Role`, `Severity`, `RiskLevel`, `User`, `Zone` con `geometry`, `Team`, `AlertType`, `DismissReason` y `ApiErrorBody`, según contracts/api-catalogs.md) y `frontend/src/domain/format.ts` (`formatDateTime` y `formatClock` con `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })`).
- [x] T017 [P] Crear `frontend/src/domain/severity.ts` (mapa Severity → `{label, colorClass, icon: 'octagon-alert'|'triangle-alert'|'circle-alert'|'info', order}`, más `RiskLevel` `normal` → "Normal") y `frontend/src/domain/status.ts` (las etiquetas legibles de los estados de alerta e incidente del doc 05 §2-3, para StatusBadge).
- [x] T018 Crear `frontend/src/infrastructure/http.ts`: `http.get/post/put` sobre `fetch` con base relativa `/api`, la cabecera `X-Actor-Id` obtenida de un *getter* inyectable (`setActorProvider(fn)`), el parseo del formato de error común en `ApiError(code, message, status, details)` y un mensaje genérico en español ante fallos de red.
- [x] T019 [P] Crear `frontend/src/application/queryClient.ts` (QueryClient con `retry: 1` y `refetchOnWindowFocus: false`), `frontend/src/application/queryKeys.ts` (claves `catalog.users`, `catalog.zones`, `catalog.teams`, `catalog.alertTypes`, `catalog.dismissReasons` y `me`) y `frontend/src/application/stores/toasts.ts` (store con `useSyncExternalStore`: `success`, `error`, `info`; autocierre a los 5 s salvo los persistentes).
- [x] T020 Crear los componentes base que necesitan el login y el shell en `frontend/src/presentation/components/`:
  - `Button.tsx`: variantes primary, secondary, ghost y danger; `loading` con spinner y disabled.
  - `Skeleton.tsx`: variantes text, card y table.
  - `EmptyState.tsx`: icono, título, mensaje y acción opcional.
  - `ErrorState.tsx`: mensaje y botón "Reintentar".
  - `Toaster.tsx`: región `aria-live="polite"` y `assertive` para los errores.
  - `Tooltip.tsx`: hover y focus con `aria-describedby`.
- [x] T021 Crear `frontend/src/main.tsx` y `frontend/src/App.tsx` (QueryClientProvider, RouterProvider y Toaster) y un `frontend/src/router.tsx` inicial con la ruta `/login` y un layout raíz.

**Checkpoint**: el backend arranca con `uv run uvicorn app.main:app --port 8000` y crea la base de datos sembrada; el frontend arranca con `bun run dev`.

---

## Phase 3: User Story 1 - Levantar la demo con un solo comando (Priority: P1) 🎯 MVP

**Goal**: un único comando deja la API y la web operativas, con los catálogos sembrados.

**Independent Test**: borrar `backend/data/aerosecure.db`, ejecutar `./start-demo.ps1` y comprobar `/api/health` y `http://localhost:5173` (quickstart #1, #2 y #8).

- [x] T022 [P] [US1] Crear `backend/app/repositories/settings_repo.py` (`SettingsRepository.get(key)` y `get_all()`, que devuelven los valores JSON decodificados).
- [x] T023 [US1] Crear `backend/app/services/health_service.py` (`HealthService.check()`: ejecuta `SELECT 1` → `db: "ok"|"error"`; lee `simulator.enabled` e `interval_seconds` de settings; `running: false`).
- [x] T024 [US1] Crear `backend/app/api/schemas/catalog.py` con `HealthOut` y `SimulatorStatusOut`, y `backend/app/api/routers/health.py` con `GET /health`, según contracts/api-catalogs.md; registrarlo en `backend/app/main.py`.
- [x] T025 [US1] Crear `start-demo.ps1` en la raíz:
  1. Validar que existen `uv` y `bun` (mensaje claro si faltan).
  2. Comprobar con `Get-NetTCPConnection` que 8000 y 5173 están libres; si no, informar del puerto en conflicto y salir con código 1.
  3. Ejecutar `uv sync` si falta `backend/.venv` y `bun install` si falta `frontend/node_modules`.
  4. Lanzar con `Start-Process powershell` el backend (`uv run uvicorn app.main:app --reload --port 8000`) y el frontend (`bun run dev`), en ventanas con título.
  5. Sondear `http://localhost:8000/api/health` hasta 60 s y abrir `http://localhost:5173`.
  6. Mostrar las URLs y cómo detener la demo.

**Checkpoint**: US1 verificable de forma independiente.

---

## Phase 4: User Story 4 - Catálogos disponibles (Priority: P2)

> Se implementa antes que US2 porque el login consume `GET /users`.

**Goal**: exponer los catálogos y el mecanismo de actor.

**Independent Test**: los `curl` de quickstart #3 a #7 devuelven lo esperado.

- [x] T026 [US4] Crear `backend/app/repositories/catalog_repo.py` con `CatalogRepository`: `list_users()`, `get_user(id)`, `list_zones()` (ordenadas por id), `list_teams()` y `list_alert_types()`.
- [x] T027 [US4] Crear `backend/app/services/catalog_service.py` con `CatalogService`:
  - Listados de usuarios, equipos y tipos (los tipos combinan `confidence_threshold` con el override de `app_settings` `thresholds.<code>` y deserializan `protocol_json`).
  - `list_zones()` con `risk_level = "normal"` y `active_alerts = 0` (punto de extensión para la feature 002).
  - `list_dismiss_reasons()` desde `DISMISS_REASON_LABELS`.
  - `resolve_actor(actor_id)`, que lanza `DomainError("ACTOR_REQUERIDO", "Selecciona un perfil para continuar.", status=401)` si el id falta o no existe.
- [x] T028 [US4] Añadir a `backend/app/api/schemas/catalog.py` los DTOs `UserOut`, `ZoneOut` (con `geometry {x,z,w,d,h}`, `riskLevel`, `activeAlerts`), `TeamOut`, `AlertTypeOut` (`protocol: list[str]`) y `DismissReasonOut` (`requiresText` opcional).
- [x] T029 [US4] Crear `backend/app/api/deps.py` con `get_session`, `get_actor(x_actor_id: str | None = Header(None, alias="X-Actor-Id"))` (vía CatalogService) y `require_supervisor` (403 `SOLO_SUPERVISOR` con el mensaje "Esta acción es solo para supervisores.").
- [x] T030 [US4] Crear `backend/app/api/routers/catalog.py` con `GET /users`, `GET /me` (Depends get_actor), `GET /zones`, `GET /teams`, `GET /alert-types` y `GET /dismiss-reasons` (`response_model_by_alias=True`); registrarlo en `backend/app/main.py`.
- [x] T031 [P] [US4] Crear `frontend/src/infrastructure/api/catalog.ts` con `getUsers`, `getMe`, `getZones`, `getTeams`, `getAlertTypes` y `getDismissReasons` sobre `http.ts`.

**Checkpoint**: los catálogos coinciden con los docs 05 y 07 (SC-002).

---

## Phase 5: User Story 2 - Elegir un perfil simulado (Priority: P1)

**Goal**: login simulado persistente, con redirecciones y validación del perfil.

**Independent Test**: quickstart #10, #11, #12, #18 y #19.

- [x] T032 [P] [US2] Crear `frontend/src/application/stores/actor.ts`: store sobre `localStorage['aerosecure.actor']` con `useSyncExternalStore` (`getActorId`, `setActor`, `clearActor`, `useActorId`) y registro del provider en `http.ts` (`setActorProvider(getActorId)`).
- [x] T033 [US2] Crear `frontend/src/application/hooks/useUsers.ts` (`useUsers()` con `queryKeys.catalog.users`) y `frontend/src/application/hooks/useCurrentUser.ts` (combina `useActorId` con `useUsers`: devuelve `{ user, status }` y, si el id guardado no existe en el catálogo, llama a `clearActor()`).
- [x] T034 [US2] Crear `frontend/src/presentation/layout/RequireActor.tsx` (sin perfil válido → `<Navigate to="/login" replace state={{ from }}>`; mientras carga, skeleton de pantalla).
- [x] T035 [US2] Crear `frontend/src/presentation/pages/LoginPage.tsx` según el doc 09 §3.1:
  - Logo, "Selecciona tu perfil" y una tarjeta por usuario (icono, alias y rol en español), accesible como botón.
  - Debajo, "Acceso simulado para la demo. No requiere contraseña."
  - Los 4 estados: Skeleton, ErrorState con reintento, EmptyState si no hay usuarios, y toast de bienvenida al entrar.
  - Al elegir: `setActor(id)` y navegar a `from` o a `/`. Si ya hay un perfil válido, redirige a `/`.
- [x] T036 [US2] Registrar en `frontend/src/router.tsx` la ruta `/login` (dentro de un layout mínimo con DemoBanner) y el layout protegido (`RequireActor`) para el resto de rutas.

**Checkpoint**: se puede entrar, recargar y cambiar de perfil (US2 completa sobre el shell mínimo).

---

## Phase 6: User Story 3 - Shell con identidad visual y aviso de demostración (Priority: P2)

**Goal**: shell completo según el doc 09 §1-2, con navegación por rol y placeholders.

**Independent Test**: quickstart #13 a #17.

- [x] T037 [P] [US3] Crear `frontend/src/domain/navigation.ts` con los ítems del menú: `{ path, label, icon (lucide), supervisorOnly }` para Resumen `/`, Alertas `/alertas`, Incidentes `/incidentes`, Mapa `/mapa`, Análisis `/analisis`, Reportes `/reportes` (supervisorOnly) y Configuración `/configuracion` (supervisorOnly), y el título de vista por ruta.
- [x] T038 [P] [US3] Crear `frontend/src/presentation/layout/DemoBanner.tsx`: fijo arriba, 32 px, fondo `demo-bg`, texto `demo-fg`, icono `flask-conical` y el texto exacto "Modo demostración: detecciones simuladas, requieren validación humana"; sin botón de cierre; `role="note"`.
- [x] T039 [P] [US3] Crear `frontend/src/presentation/layout/Clock.tsx` (actualiza cada 30 s; formato `dd MMM yyyy HH:mm` en America/Bogota con `formatClock`; `<time dateTime>`).
- [x] T040 [US3] Crear `frontend/src/presentation/layout/Sidebar.tsx`:
  - Fondo `navy-950`, 240 px; en < 1024 px se colapsa a 72 px con iconos y Tooltip.
  - Logo "AeroSecure AI", ítems filtrados por rol desde `navigation.ts` con `NavLink` (estado activo con `aria-current`) y espacio reservado para los badges de contador (vacío en 001).
  - Pie con la tarjeta del perfil (alias y rol) y el botón "Cambiar perfil" (`clearActor` + navegar a `/login`).
- [x] T041 [US3] Crear `frontend/src/presentation/layout/Topbar.tsx` (64 px):
  - Título de la vista, "Aeropuerto Internacional Demo · Terminal 1" y `Clock`.
  - Botones "Críticas (N)", "Reportar evento", campana e indicador "En vivo", deshabilitados (`aria-disabled`) con el Tooltip "Disponible en una próxima versión".
- [x] T042 [US3] Crear `frontend/src/presentation/layout/Shell.tsx` (DemoBanner + Sidebar + Topbar + `<main id="contenido">` con ancho máximo de 1440 px, padding de 24 px y fondo `surface-muted`; enlace "Saltar al contenido" para teclado) y `frontend/src/presentation/layout/RequireSupervisor.tsx` (si el rol no es supervisor: toast info "Esta sección es solo para supervisores." y `<Navigate to="/" replace>`).
- [x] T043 [US3] Crear `frontend/src/presentation/pages/PlaceholderPage.tsx` (prop `title`; EmptyState con el icono `construction` y el mensaje "Disponible en una próxima versión") y `frontend/src/presentation/pages/NotFoundPage.tsx` (mensaje y enlace al Resumen).
- [x] T044 [US3] Completar `frontend/src/router.tsx` con todas las rutas de contracts/ui-routes.md dentro de `Shell` (`/`, `/alertas`, `/alertas/:id`, `/incidentes`, `/incidentes/:id`, `/mapa`, `/analisis` y, con RequireSupervisor, `/reportes` y `/configuracion`) más `*` → NotFoundPage; cada una con su PlaceholderPage y título.

**Checkpoint**: shell completo navegable para ambos roles.

---

## Phase 7: User Story 5 - Componentes visuales base (Priority: P3)

**Goal**: completar los componentes del sistema visual para las features 002-009.

**Independent Test**: los componentes se ven en una sección "Vista previa de componentes" del placeholder del Resumen (badges de las 4 severidades y estados, KpiCard, apertura de ConfirmDialog con teclado).

- [x] T045 [P] [US5] Crear `frontend/src/presentation/components/SeverityBadge.tsx` (prop `severity: Severity | 'normal'`: icono lucide, texto y color desde `domain/severity.ts`; el rojo solo para `critica`; tamaños sm y md).
- [x] T046 [P] [US5] Crear `frontend/src/presentation/components/StatusBadge.tsx` (prop `status`, con la etiqueta legible desde `domain/status.ts` y un icono por estado: `nueva` sparkles, `en_revision` eye, `confirmada` check-circle, `descartada` x-circle, `abierto` folder-open, `en_atencion` activity, `escalado` arrow-up-right, `resuelto` check-check).
- [x] T047 [P] [US5] Crear `frontend/src/presentation/components/Card.tsx` (título opcional, acciones y contenido; borde y sombra suave) y `frontend/src/presentation/components/KpiCard.tsx` (icono, etiqueta, valor con números tabulares y variación opcional con flecha, texto accesible y la semántica `higherIsWorse`).
- [x] T048 [US5] Crear `frontend/src/presentation/components/Dialog.tsx` (con `<dialog>` nativo y `showModal()`: Esc cierra, foco inicial dentro y devolución del foco al disparador al cerrar; `aria-labelledby`) y `frontend/src/presentation/components/ConfirmDialog.tsx` (título, descripción, `confirmLabel`, variante danger, `loading`; Cancelar como acción por defecto en el foco).
- [x] T049 [US5] Añadir a `PlaceholderPage` del Resumen (`frontend/src/presentation/pages/PlaceholderPage.tsx`, prop `showComponentPreview`) una sección "Vista previa de componentes" con SeverityBadge ×4, StatusBadge ×8, 2 KpiCard y un botón que abre un ConfirmDialog de ejemplo. Es temporal y se retira en la feature 005.

**Checkpoint**: todas las historias están completas.

---

## Phase 8: Polish & cross-cutting

- [x] T050 [P] Revisar la accesibilidad del shell y el login: orden de Tab, foco visible, `aria-current`, `aria-live`, contraste AA de los textos sobre `navy-950` y `demo-bg`, y reduced-motion (doc 09 §6).
- [x] T051 [P] Revisar la vista tablet (768-1023 px): sidebar colapsado, topbar sin desbordes y textos truncados con tooltip (doc 09 §7).
- [x] T052 Ejecutar `cd backend; uv run ruff check . ; uv run ruff format .` y `cd frontend; bun run lint ; bunx tsc --noEmit`, y corregir hasta tener 0 errores (SC-008).
- [x] T053 Revisión del agente `layer-guardian` sobre la feature (capas, constitución, que no haya tests ni dependencias no aprobadas) y aplicar los hallazgos bloqueantes e importantes.
- [x] T054 **Verificación manual**: ejecutar `specs/001-fundacion/quickstart.md` #1 a #20 y, del checklist del doc 11 §3, los ítems **Generales** (arranque con un comando sin errores, banner visible en todas las vistas, sin datos personales, escritorio y tablet, severidad con icono y texto, estados de UI) y **HU-01/02** (login simulado, alias en la barra, cambio de perfil, banner). Anotar el resultado en `specs/001-fundacion/checklists/requirements.md` (sección Notes).

---

## Dependencies & Execution Order

- **Setup (F1)** → **Foundational (F2)** → historias.
- **US1 (F3)**: depende solo de F2.
- **US4 (F4)**: depende de F2. Se adelanta porque **US2 consume `GET /users` y `/me`**.
- **US2 (F5)**: depende de US4 (T030, T031).
- **US3 (F6)**: depende de US2 (actor y rol para filtrar el menú y para RequireSupervisor).
- **US5 (F7)**: depende de F2; T049 depende de US3 (T043).
- **Polish (F8)**: al final.

## Parallel Opportunities

- F1: T002, T003 y T004 en paralelo con T001 (back y front son independientes).
- F2: T005-T008 en paralelo; T012 en paralelo con T009-T011; en el front, T015-T017 y T019 en paralelo.
- Back y front de cada historia en paralelo: p. ej. T031 (front) mientras se hace T026-T030 (back).
- US3: T037, T038 y T039 en paralelo. US5: T045, T046 y T047 en paralelo.

```text
# Ejemplo (Foundational):
backend-engineer : T005, T006, T007, T008 → T009 → T010 → T011 → T013 → T014
frontend-engineer: T015, T016, T017, T019 → T018 → T020 → T021
```

## Implementation Strategy

1. **MVP**: F1 + F2 + US1. Arranque con un comando y catálogos sembrados (verificable con health).
2. + US4 + US2: login simulado funcional sobre la API real.
3. + US3: shell completo por rol (feature demostrable).
4. + US5 + Polish + verificación manual → commit `feat(001-fundacion): …`.

## Notes

- **Sin tareas de tests** por diseño (constitución VIII).
- Backend con el agente `backend-engineer` (skills `fastapi-layered`, `aerosecure-domain`); frontend con `frontend-engineer` (skill `react-layered-ui`).
- Commit sugerido al cerrar cada fase o al final de la feature.
