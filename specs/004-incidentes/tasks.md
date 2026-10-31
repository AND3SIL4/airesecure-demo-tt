---
description: "Lista de tareas de la feature 004-incidentes"
---

# Tasks: Gestión de incidentes e historial

**Input**: `specs/004-incidentes/`

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup
- [x] T001 Confirmar la rama `004-incidentes` y que no cambian las dependencias.

## Phase 2: Foundational

### Backend
- [x] T002 [P] Ampliar `backend/app/domain/state_machine.py` con `IncidentAction` (añadir el enum `IncidentAction`: assign, start, escalate, resolve, comment en `domain/enums.py`), `INCIDENT_ALLOWED_FROM` y `next_incident_status` (research R1).
- [x] T003 [P] Crear `backend/app/domain/incident_rules.py` con las validaciones (motivo ≥ 10, nota ≥ 10, comentario 3..500, equipo especializado) y los mensajes de data-model.md.
- [x] T004 Ampliar `backend/app/repositories/incident_repo.py`:
  - `get`, `save`.
  - `list(filters, sort, page, page_size)` con JOIN a alerts: status (con el atajo `en_curso`), severity, zone, type, q (inc.id, alert.id o description), from y to sobre opened_at. Orden openedAt, severity o responseSeconds, con los nulos al final.
  - `counts_in_course()`.
- [x] T005 Ampliar `backend/app/repositories/timeline_repo.py` con `list_combined(alert_id, incident_id)` (OR, sin duplicados, en orden ascendente) y `last_decision_for_incident(incident_id)` (start, escalate o resolve).
- [x] T006 Ajustar `backend/app/services/alert_service.py` `_confirm`: fijar `incident.response_seconds = first_action_at − detected_at` (en segundos enteros).

### Frontend
- [x] T007 [P] Ampliar `frontend/src/domain/types.ts` con `Incident`, `TeamRef`, `IncidentActionBody` (unión) y `IncidentPage`; crear `frontend/src/domain/incidentFilters.ts` (parse/serialize en la URL: status con 'en_curso', severity, zone, type, q, range: 'hoy' | '7d' | '30d' (por defecto) | 'custom' con from/to, sort `openedAt:desc` y page); ampliar `domain/status.ts` con `allowedIncidentActions(status, hasTeam)` y `domain/format.ts` con `formatDuration(seconds)` ("4 min", "1 h 12 min").
- [x] T008 [P] Crear `frontend/src/infrastructure/api/incidents.ts` (`getIncidents`, `getIncident`, `postIncidentAction`, `getIncidentsInCourseTotal`) y ampliar `frontend/src/application/queryKeys.ts` (`incidents.all = ['incidents']`, `list(filters)`, `detail(id)` y `counts`), verificando que `useLiveEvents` invalida `incidents.all` y `incidents.counts`.

## Phase 3: US1 - Gestionar un incidente (P1) 🎯 MVP
- [x] T009 [US1] Crear `backend/app/services/incident_service.py` con `IncidentService(session, publisher)`:
  - `get_detail(id)`: el incidente + la alerta (vista summary) + los equipos + `openedBy` + la timeline combinada con actores. Si no existe, 404 "El incidente {id} no existe.".
  - `apply_action(id, command, actor)`: en una transacción con `begin_write`, valida con el dominio, aplica los efectos de data-model.md (escalate cambia `team_id` y `escalated_to_id`; resolve calcula `resolution_seconds`; start conserva el primer `started_at`) e inserta el evento con el payload. Las transiciones inválidas dan 409 con un mensaje y `details`; si falta equipo, 422 `EQUIPO_REQUERIDO`. Tras el commit publica `incident.updated {id, status, actorId}`.
- [x] T010 [US1] Crear `backend/app/api/schemas/incidents.py` (`IncidentOut`, `IncidentDetailOut` con timeline, `TeamRefOut`, `IncidentActionIn` como unión discriminada y `IncidentPageOut`) y `backend/app/api/routers/incidents.py` con `GET /incidents/{id}` y `POST /incidents/{id}/actions` (Actor y Publisher). Registrarlo en `main.py`.
- [x] T011 [P] [US1] Crear `frontend/src/application/hooks/useIncident.ts` y `useIncidentAction.ts` (avisos del contrato; ante un 409, refetch; invalida `incidents.all`, `incidents.counts` y `alerts.all`).
- [x] T012 [US1] Crear en `frontend/src/presentation/features/incidents/`:
  - `AssignTeamDialog.tsx`: select de equipos con el especializado marcado y comentario opcional.
  - `EscalateIncidentDialog.tsx`: radios solo de especializados, motivo de 10 o más caracteres y confirmación.
  - `ResolveIncidentDialog.tsx`: ConfirmDialog con la nota de 10 o más caracteres.
  - `IncidentActionsPanel.tsx`: botones según `allowedIncidentActions`; "Atender" deshabilitado con tooltip si no hay equipo; resumen de resuelto; foco al bloque de estado tras escalar o resolver; reutiliza `features/alerts/CommentDialog`.
- [x] T013 [US1] Crear `frontend/src/presentation/pages/IncidentDetailPage.tsx` (encabezado, panel "Alerta de origen" con enlace, Timeline combinada, IncidentActionsPanel, skeleton y 404) y registrar `/incidentes/:id` en `frontend/src/router.tsx`.

## Phase 4: US2 - Registro de incidentes (P1)
- [x] T014 [US2] Añadir `IncidentService.list(query)` (normaliza los filtros; los inválidos se ignoran) y `GET /incidents` en `backend/app/api/routers/incidents.py`.
- [x] T015 [P] [US2] Crear `frontend/src/presentation/components/DateRangePresets.tsx` (Hoy / 7 días / 30 días / Personalizado con dos `<input type="date">` accesibles).
- [x] T016 [US2] Crear `frontend/src/presentation/features/incidents/IncidentFilterBar.tsx` (búsqueda con debounce, presets, MultiSelect de Estado con "En curso", Severidad, Zona y Tipo, chips y limpiar) y `IncidentTable.tsx` (columnas del contrato, ordenables con `aria-sort`, navegación con teclado y "—" para los tiempos nulos).
- [x] T017 [US2] Crear `frontend/src/application/hooks/useIncidents.ts` y `frontend/src/presentation/pages/IncidentsPage.tsx` (filtros en la URL, paginación, 4 estados) y registrar `/incidentes` en `router.tsx`.
- [x] T018 [US2] Badge de incidentes en curso en `frontend/src/presentation/layout/Sidebar.tsx` (`useIncidentCounts`, `sr-only` "N incidentes en curso", oculto si es 0).

## Phase 5: US3 - Detalle e historia (P2)
- [x] T019 [US3] Verificar que el enlace "Ver incidente" de `features/alerts/AlertActionsPanel.tsx` abre el detalle real y que la Timeline muestra correctamente las etiquetas e iconos de assign, start, escalate y resolve (con el equipo del payload); ajustar `domain/timeline.ts` si falta algo.

## Phase 6: US4 - Histórico realista (P2)
- [x] T020 [US4] Crear `backend/app/infrastructure/seed/plan.py` con `PlannedAlert`, `PlannedIncident` y `PlannedEvent` (offsets relativos) y `materialize(session, plans, now)`: ordena las alertas por `detected_at` → `ALT-2001…`; ordena los incidentes por `opened_at` → `INC-0401…`; inserta con `session.add` (sin repositories) y calcula el score con `compute_score`.
- [x] T021 [US4] Adaptar `backend/app/infrastructure/seed/alerts.py` para que **devuelva planes** (las 12 activas, las 3 descartadas de hoy y las 3 de la anomalía) en vez de insertar.
- [x] T022 [US4] Crear `backend/app/infrastructure/seed/history.py` (research R6: unas 220 alertas en 30 días hasta ayer a las 23:59; picos horarios; +15 % en la última semana; severidades 8/22/45/25 % de las confirmadas; zonas ponderadas y compatibles; ≈ 70 descartadas con motivos variados; ≈ 150 confirmadas con incidente resuelto; respuesta de 1-8 min (críticas 1-3); resolución de 15-120 min (escalados 45-180); ≈ 10 % escalados al especializado según el tipo; actores 90 % operadores y 10 % sup-a; eventos completos; `random.Random(2048)`).
- [x] T023 [US4] Crear `backend/app/infrastructure/seed/today.py` (6 incidentes resueltos hoy, repartidos entre las 00:00 y hace 1 h, y los 3 en curso del doc 10 §4 con los equipos y estados indicados) y orquestar en `seed/__init__.py`: `seed_all` = catálogos + (si no hay alertas) `materialize(history + today + alerts)`.

## Phase 7: Polish
- [x] T024 [P] Documentar en el doc 08 §3.4: el atajo `en_curso`, el orden con los nulos al final, la historia combinada en el detalle y `responseSeconds` calculado al confirmar.
- [x] T025 Ejecutar los linters (ruff check y format; eslint, tsc y build) hasta tener 0 errores.
- [x] T026 Revisión del agente `layer-guardian` y aplicación de los hallazgos bloqueantes e importantes.
- [x] T027 **Verificación manual**: quickstart #1-#17 y HU-16 a HU-21 del doc 11 §3; anotar el resultado en `checklists/requirements.md`.

## Dependencies
- F2 → US1/US2 (paralelos) → US3. US4 (siembra) es independiente de la UI (solo backend) y se puede hacer en paralelo con US1.
- Backend: T002-T006, T009-T010, T014, T020-T023. Frontend: T007-T008, T011-T013, T015-T019.
