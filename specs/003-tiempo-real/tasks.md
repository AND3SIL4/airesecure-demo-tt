---
description: "Lista de tareas de la feature 003-tiempo-real"
---

# Tasks: Tiempo real, simulador y escenarios

**Input**: `specs/003-tiempo-real/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 Confirmar la rama `003-tiempo-real` y que no se añaden dependencias (`backend/pyproject.toml` y `frontend/package.json` sin cambios).

---

## Phase 2: Foundational (bloqueante)

### Backend
- [x] T002 [P] Crear `backend/app/services/ports.py` con `class EventPublisher(Protocol): def publish(self, event: str, data: dict[str, Any]) -> None` y `class NullPublisher` (no-op).
- [x] T003 [P] Crear `backend/app/infrastructure/event_bus.py` con `EventBus` (research R2):
  - `bind_loop(loop)`, `subscribe() -> asyncio.Queue` (`maxsize=100`) y `unsubscribe(q)`.
  - `publish(event, data)`, seguro entre hilos con `loop.call_soon_threadsafe`; si no hay loop enlazado, no hace nada.
  - `_fanout`: si una cola está llena, descarta su evento más antiguo.
  - `subscriber_count`.
- [x] T004 Añadir a `backend/app/api/deps.py` `get_publisher(request) -> EventPublisher` (`request.app.state.event_bus`) y `PublisherDep`. En `backend/app/main.py`: crear `EventBus()` en `app.state.event_bus` y hacer `bind_loop(asyncio.get_running_loop())` en el lifespan.
- [x] T005 Cambiar `backend/app/services/alert_service.py` (research R3):
  - El constructor recibe `publisher: EventPublisher = NullPublisher()`.
  - `apply_action` y `report_manual` acumulan los eventos y los publican **tras el commit**: `alert.updated {id, status, actorId}`; en confirm, además `incident.created {id, alertId, actorId}`; en report_manual, `alert.created` = AlertSummary serializado en camelCase + `actorId`.
  - Añadir un helper de dominio-servicio que serialice el summary (`_summary_payload`) sin depender de `api`.
  - Quitar los comentarios "llega con la feature 003".
- [x] T006 Inyectar `PublisherDep` en `backend/app/api/routers/alerts.py` (POST /alerts y POST /alerts/{id}/actions) al construir `AlertService`.
- [x] T007 Crear `backend/app/api/routers/stream.py` con `GET /stream`, según research R4 y contracts/api-realtime.md: StreamingResponse `text/event-stream` con las cabeceras no-cache, primer mensaje `retry: 3000`, `wait_for(queue.get(), 15)` → `heartbeat {ts}`, comprobación de `request.is_disconnected()` y `unsubscribe` en el `finally`, y JSON con `ensure_ascii=False`. Registrarlo en `main.py`.

### Frontend
- [x] T008 [P] Crear `frontend/src/domain/liveEvents.ts` con los tipos `LiveEventName` (`alert.created`, `alert.updated`, `incident.created`, `incident.updated`, `settings.updated`, `demo.reset`, `heartbeat`), los tipos de datos de cada evento (con `actorId`) y `LiveStatus` (`connecting`, `open`, `reconnecting`).
- [x] T009 [P] Crear `frontend/src/infrastructure/sse.ts` con `connectLiveEvents({ onEvent(name, data), onStatus(status) }) -> () => void`, sobre `EventSource('/api/stream')`: `addEventListener` por cada nombre, `JSON.parse` protegido, `onopen` → open y `onerror` → reconnecting (el navegador reintenta solo).
- [x] T010 [P] Crear `frontend/src/application/stores/liveStatus.ts` (`useLiveStatus` con `useSyncExternalStore`; `reconnecting` solo se publica tras 3 s seguidos sin conexión; registra `wasDisconnected` para disparar el refetch al reconectar) y `frontend/src/application/stores/notifications.ts` (`push(notification)`, las últimas 10, `unreadCount`, `markAllRead`, `useNotifications`, y `newAlertIds` con un contador de llegadas para la píldora).
- [x] T011 Ajustar `frontend/src/application/stores/toasts.ts`: como máximo 3 toasts no persistentes visibles (se descarta el más antiguo) y opción `assertive` para los críticos.

**Checkpoint**: el stream emite heartbeat y las acciones publican eventos.

---

## Phase 3: User Story 1 - Recibir alertas nuevas sin recargar (P1) 🎯 MVP

**Independent Test**: quickstart #1-#3 y #11-#14.

- [x] T012 [US1] Crear `frontend/src/application/useLiveEvents.ts` (research R8):
  - Suscribe una vez con `connectLiveEvents` y actualiza `liveStatus`.
  - `alert.created`: invalida `alerts.all`, `alerts.counts` y `catalog.zones`; hace push a notifications; muestra el toast (si `actorId` ≠ el perfil activo): crítico persistente con la acción `{label: 'Ver alerta', to: '/alertas/{id}'}` y `assertive`; el resto, normal.
  - `alert.updated`: invalida `alerts.all`, `alerts.counts`, `catalog.zones` y `alerts.detail(id)`. Si el detalle de ese id está montado (registro de "vistas activas" en el store) y el actor es otro, toast info "La alerta {id} fue {estado legible} por otro usuario".
  - `incident.created` y `incident.updated`: invalidan `['incidents']`, `alerts.all` y `['dashboard']`.
  - `settings.updated`: invalida `['settings']`.
  - `demo.reset`: `queryClient.clear()` y navegar a `/`.
  - Al pasar de reconnecting a open: `invalidateQueries()`.
- [x] T013 [US1] Montar `useLiveEvents` en `frontend/src/presentation/layout/Shell.tsx` y añadir `frontend/src/application/hooks/useAlertCounts.ts` (`GET /api/alerts?status=activas&pageSize=1` → `total`; clave `alerts.counts` en `frontend/src/application/queryKeys.ts`).
- [x] T014 [US1] Badge de pendientes en `frontend/src/presentation/layout/Sidebar.tsx` junto a "Alertas" (`aria-label="N alertas pendientes"`, oculto si es 0, mini-badge en modo colapsado).
- [x] T015 [US1] Crear `frontend/src/presentation/components/NotificationsPopover.tsx` (lista de 10 con SeverityBadge, tipo, zona, RelativeTime y Link; vacío "Sin notificaciones en esta sesión"; Esc cierra; foco gestionado) y habilitar la campana en `frontend/src/presentation/layout/Topbar.tsx` (contador de no leídas "9+", `aria-expanded`, marcar como leídas al abrir).
- [x] T016 [US1] Lista en vivo en `frontend/src/presentation/pages/AlertsPage.tsx` y `frontend/src/presentation/features/alerts/AlertTable.tsx` (research R10):
  - Resalta de 2 s los ids recién llegados (varios a la vez).
  - Si el foco está dentro de la tabla, congela los datos mostrados y muestra la píldora "N alertas nuevas · Mostrar" (`aria-live="polite"`), que al pulsarse descongela y resalta.
  - En el detalle (`frontend/src/presentation/pages/AlertDetailPage.tsx`), registra la vista activa del id en el store para el aviso "por otro usuario".

**Checkpoint**: las alertas creadas por acciones y reportes llegan en vivo a todas las pestañas.

---

## Phase 4: User Story 2 - Simulador con umbrales (P1)

**Independent Test**: quickstart #4-#6 y #16.

- [x] T017 [P] [US2] Crear `backend/app/domain/simulation.py` con `ZONE_COMPATIBILITY` (research R5), `CONFIDENCE_RANGE`, `INTERVAL_JITTER`, `SimulatedEvent` y `draw_event(rng, alert_types, zones, sources)`: tipo ponderado por `scenario_weight` (excluye 0), zona compatible, fuente de esa zona (cámara o sensor), confianza redondeada a 2 decimales y severidad con `elevate_severity`. También `next_delay(rng, interval)`.
- [x] T018 [US2] Añadir a `backend/app/repositories/settings_repo.py` `get_int(key, default)` e `increment(key)` (crea la clave con 1 si no existe), y sembrar `stats.below_threshold = 0` (solo si no existe) en `backend/app/infrastructure/seed/__init__.py` o en `seed/catalogs.py`.
- [x] T019 [US2] Añadir a `backend/app/services/alert_service.py`:
  - `create_from_event(event, origin, *, actor=None, extra_timeline=None) -> Alert`: score, recomendación, `evidence_key`, descripción con las plantillas de `seed/texts.py` (si importarlas viola las capas, mover las plantillas a `domain/alert_texts.py` y reexportarlas desde la semilla) y el evento `created`; publica `alert.created` tras el commit.
  - `simulate_event(rng) -> Alert | None`: carga los catálogos, `draw_event`, umbral efectivo (setting `thresholds.<code>` o el del tipo); si la confianza es menor que el umbral, `increment('stats.below_threshold')` y devuelve None; si no, `create_from_event(origin=simulador)`.
- [x] T020 [US2] Crear `backend/app/infrastructure/simulator.py` con `Simulator(engine, publisher)`: `start()`, `stop()` (cancelar y esperar) y la propiedad `running`. El bucle lee los settings en `to_thread`; si está desactivado, duerme 5 s; espera `next_delay`; `to_thread(self._tick)` con una `Session(engine)` propia y `AlertService(session, publisher).simulate_event(rng)`; registra las excepciones del tick sin morir; `rng = random.Random()`.
- [x] T021 [US2] Integrar en `backend/app/main.py`: crear el `Simulator` en `app.state.simulator`, `start()` en el lifespan tras la siembra y `stop()` al salir. Actualizar `backend/app/services/health_service.py`, `backend/app/api/routers/health.py` (pasar `running` desde `app.state.simulator` vía la dependencia `SimulatorDep` en deps) y `HealthOut` en `backend/app/api/schemas/catalog.py` con `simulator.running` y `belowThreshold`.

**Checkpoint**: el simulador genera alertas coherentes en vivo.

---

## Phase 5: User Story 3 - Escenarios predefinidos (P2)

**Independent Test**: quickstart #7-#10.

- [x] T022 [P] [US3] Crear `backend/app/domain/scenarios.py` con `Scenario` y `SCENARIOS` E-1 a E-4 (doc 10 §8), más `final_severity(scenario, zone_restricted)`.
- [x] T023 [US3] Crear `backend/app/services/scenario_service.py` con `ScenarioService(session, publisher)`: `list()` (con la severidad final) y `trigger(id, actor)` (404 "El escenario no existe."; crea con `AlertService.create_from_event(origin=escenario, actor=None, extra_timeline=scenario_triggered(actor, {scenarioId}))` en la misma transacción; publica `alert.created`).
- [x] T024 [US3] Crear `backend/app/api/schemas/demo.py` (`ScenarioOut`) y `backend/app/api/routers/demo.py` con `GET /demo/scenarios` y `POST /demo/scenarios/{id}/trigger` (SupervisorDep, PublisherDep; 201 AlertDetailOut); registrarlo en `main.py`.

---

## Phase 6: User Story 4 - Indicador de conexión (P3)

**Independent Test**: quickstart #15.

- [x] T025 [US4] Indicador en `frontend/src/presentation/layout/Topbar.tsx`, según `useLiveStatus`: verde "En vivo" o ámbar "Reconectando…", con texto accesible.
- [x] T026 [US4] Crear `frontend/src/presentation/layout/ConnectionBanner.tsx` ("Conexión en vivo perdida. Reintentando…", `role="status"`, ámbar) y montarlo bajo la Topbar en `Shell.tsx` cuando el estado sea `reconnecting`.

---

## Phase 7: Polish & cross-cutting

- [x] T027 [P] Documentar en los docs: doc 08 §3.7 (`actorId` en los eventos; `/api/stream` sin `X-Actor-Id`; `belowThreshold` y `running` en health) y doc 10 §7 (tabla de compatibilidad de zonas).
- [x] T028 Ejecutar `cd backend; uv run ruff check . ; uv run ruff format .` y `cd frontend; bun run lint ; bunx tsc --noEmit ; bun run build` hasta tener 0 errores.
- [x] T029 Revisión del agente `layer-guardian` y aplicación de los hallazgos bloqueantes e importantes.
- [x] T030 **Verificación manual**: quickstart #1-#17 y, del checklist del doc 11 §3, HU-05, HU-27 y "Dos pestañas: confirmar en una actualiza la otra". Anotar en `specs/003-tiempo-real/checklists/requirements.md`.

---

## Dependencies & Execution Order

- F2 bloquea todo. US1 (front) depende de T005-T007. US2 depende de T002-T005. US3 depende de T019 (`create_from_event`). US4 depende de T009-T010.
- Backend (T002-T007, T017-T024) y frontend (T008-T016, T025-T026) en paralelo.

## Implementation Strategy

1. MVP: F2 + US1 (eventos de las acciones humanas en vivo).
2. + US2 (actividad automática) + US3 (guion de la demo).
3. + US4 + Polish → commit `feat(003-tiempo-real): …`.
