---
description: "Lista de tareas de la feature 002-alertas"
---

# Tasks: Gestión de alertas

**Input**: `specs/002-alertas/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: **no hay tareas de pruebas** (constitución VIII).

**Organization**: por historia de usuario y, dentro de cada una, por capas (backend domain → repositories → services → api; frontend infrastructure → application → presentation).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 Verificar la rama `002-alertas` y que no se añaden dependencias: no se modifican `backend/pyproject.toml` ni `frontend/package.json`.

---

## Phase 2: Foundational (bloqueante)

### Backend: dominio y persistencia
- [x] T002 [P] Añadir a `backend/app/domain/enums.py` los StrEnum `AlertStatus` (`nueva`, `en_revision`, `confirmada`, `descartada`), `IncidentStatus` (`abierto`, `en_atencion`, `escalado`, `resuelto`), `AlertOrigin` (`seed`, `simulador`, `escenario`, `manual`), `AlertAction` (`review`, `confirm`, `dismiss`, `comment`) y `TimelineAction` (`created`, `review`, `confirm`, `dismiss`, `comment`, `incident_created`, `assign`, `start`, `escalate`, `resolve`, `demo_reset`, `scenario_triggered`, `settings_updated`).
- [x] T003 [P] Crear `backend/app/domain/scoring.py`:
  - Dataclass `ScoreBreakdown(severity_weight, confidence, zone_factor, zone_criticality, score, manual)` con `to_json()` y `from_json()` (claves camelCase: `severityWeight`, `confidence`, `zoneFactor`, `zoneCriticality`, `score`, `manual`).
  - `compute_score(severity, confidence: float | None, zone_criticality) -> ScoreBreakdown` con `round(100 × w_sev × conf × f_zona)`, usando `SEVERITY_WEIGHT` y `ZONE_FACTOR` de `domain/catalogs.py`; si `confidence` es None → 1.0 y `manual=True`.
  - `elevate_severity(severity, restricted)`: sube un nivel si la zona es restringida, con tope en `critica`.
- [x] T004 [P] Crear `backend/app/domain/state_machine.py`:
  - `ALERT_ALLOWED_FROM = {review: {nueva}, confirm: {nueva, en_revision}, dismiss: {nueva, en_revision}, comment: todos}`.
  - `next_alert_status(current, action)`: devuelve el nuevo estado (comment → el mismo) o lanza `DomainError("TRANSICION_INVALIDA", …)`.
  - `needs_implicit_review(current, action)`: True si el estado es `nueva` y la acción es confirm o dismiss.
  - `is_active(status)`.
- [x] T005 [P] Crear `backend/app/domain/time.py` con `BOGOTA_TZ = timezone(timedelta(hours=-5), "America/Bogota")` y `format_local_time(dt) -> "HH:MM"` (sin zoneinfo).
- [x] T006 Añadir a `backend/app/domain/models.py` las tablas `Alert` (`alerts`), `Incident` (`incidents`) y `TimelineEvent` (`timeline_events`) con los campos y reglas exactos de data-model.md:
  - `alerts`: id str(12) PK "ALT-2001…", FKs a alert_types, zones y sources, `severity`/`status`/`origin` con `enum_text`, `confidence` float nullable "0.00..1.00", `score` int "0..100", `score_breakdown_json` text, `description` text "10..500", `recommendation` text, `evidence_key` str(64), `dismiss_reason` str(32) nullable, `dismiss_comment` text nullable, `reported_by`/`reviewed_by` FK users nullable, `detected_at`/`first_action_at`/`closed_at` con UtcDateTime.
  - `incidents`: `alert_id` **UNIQUE**, `status` por defecto abierto, campos nullable de equipo, tiempos y notas.
  - `timeline_events`: id int autoincremental, `alert_id` y `incident_id` nullable, `actor_id` nullable = Sistema, `action` TimelineAction, from/to status, comment, payload_json y created_at.
  - Índices: `ix_alerts_status_score (status, score)`, `ix_alerts_detected_at`, `ix_alerts_zone_id`, `ix_alerts_type_code`, `ix_incidents_status`, `ix_incidents_opened_at`, `ix_timeline_alert (alert_id, created_at)` e `ix_timeline_incident (incident_id, created_at)`.
- [x] T007 Crear `backend/app/repositories/timeline_repo.py` (`add(event)`, `list_for_alert(alert_id)` en orden ascendente por created_at e id, `last_decision_for_alert(alert_id)`: el último evento con to_status no nulo).
- [x] T008 Crear `backend/app/repositories/alert_repo.py`:
  - `get(id)`, `add(alert)`, `next_id()` (max numérico + 1, mínimo 2001, formato `ALT-%04d`).
  - `list(filters, sort, page, page_size) -> (items, total)`: filtros status, severity, zone, type, source, `q` (ilike sobre id y description), from y to; orden score, detectedAt o severity (por el orden de severidad con CASE), con desempate por detected_at descendente.
  - `active_counts_by_zone() -> dict[zone_id, (max_severity_order, count)]`.
  - `count()`.
- [x] T009 Crear `backend/app/repositories/incident_repo.py` (`add`, `next_id()` con mínimo 401 y formato `INC-%04d`, `get_by_alert(alert_id)`).
- [x] T010 Configurar en `backend/app/infrastructure/db.py` que las transacciones de escritura sean serializables en SQLite (`BEGIN IMMEDIATE`, research R4), sin romper `init_db`.
- [x] T011 Ampliar `backend/app/api/errors.py` con la traducción al español de los errores 422 de Pydantic (research R6: missing, string_too_short, string_too_long, enum, literal_error, int_parsing, float_parsing y el resto → "Valor inválido.") en `details.fields[].message`, conservando `field` como ruta en camelCase.

### Frontend: base de alertas
- [x] T012 [P] Ampliar `frontend/src/domain/types.ts` con `AlertSummary`, `AlertDetail`, `ScoreBreakdown`, `TimelineEvent`, `UserRef`, `IncidentRef`, `Page<T>`, `AlertActionBody` (unión por `action`), `ManualAlertBody` y `AlertOrigin`, según contracts/api-alerts.md.
- [x] T013 [P] Crear `frontend/src/domain/alertFilters.ts`:
  - `AlertFilters` (status | 'activas', severity[], zone[], type[], source[], q, sort, page).
  - `parseAlertFilters(URLSearchParams)`, que ignora valores inválidos y aplica 'activas' por defecto.
  - `toSearchParams(filters)` y `DEFAULT_SORT = 'score:desc'`.
- [x] T014 [P] Crear `frontend/src/domain/timeline.ts` (etiquetas en español por acción, p. ej. created "Alerta generada", review "Revisión iniciada", confirm "Alerta confirmada", dismiss "Descartada como falso positivo", comment "Comentario", incident_created "Incidente creado", y su icono lucide); ampliar `frontend/src/domain/status.ts` con `allowedAlertActions(status)`; ampliar `frontend/src/domain/format.ts` con `formatRelative(date, now)` ("hace 3 min", "hace 2 h", "hace 1 d").
- [x] T015 [P] Crear `frontend/src/domain/evidence.ts` (recuadro de detección `{x, y, w, h}` en % por type_code, coherente con cada SVG).
- [x] T016 Crear `frontend/src/infrastructure/api/alerts.ts` (`getAlerts(filters)`, `getAlert(id)`, `postAlertAction(id, body)`, `postManualAlert(body)`) sobre `http.ts`, y ampliar `frontend/src/application/queryKeys.ts` con `alerts.all`, `alerts.list(filters)` y `alerts.detail(id)`.
- [x] T017 [P] Crear los componentes genéricos en `frontend/src/presentation/components/`:
  - `RelativeTime.tsx`: hora relativa con un tooltip con la hora absoluta y `<time>`.
  - `ConfidenceMeter.tsx`: barra + % con texto; null → "N/A: reporte humano".
  - `Pagination.tsx`: "Página X de Y · N alertas", con anterior y siguiente accesibles.
  - `MultiSelect.tsx`: botón con popover de checkboxes, accesible con teclado.

**Checkpoint**: el backend arranca y crea las tablas nuevas; el frontend compila.

---

## Phase 3: User Story 1 - Ver y priorizar las alertas activas (P1) 🎯 MVP

**Independent Test**: quickstart #1-#4, #14-#18.

- [x] T018 [US1] Crear `backend/app/infrastructure/seed/texts.py` con las plantillas de descripción del doc 10 §5 (3 a 5 por tipo, con `{zona}`, `{fuente}`, `{min}` y `{n}`; tono sin certeza: "Posible…") y `render(type_code, idx, **vars)`.
- [x] T019 [US1] Crear `backend/app/infrastructure/seed/alerts.py` con `seed_alerts(session, now)`, según data-model.md §Datos semilla:
  - Las 12 activas del doc 10 §4: minutos relativos, estados y fuentes; la #2 con severidad critica; las 4 en revisión con revisor y `review` 1-3 min después; la #11 manual con reported_by op-02 y confidence null.
  - 3 descartadas de hoy y 3 descartadas de concentración en T1-EMBARQUE-A (hace 25, 38 y 52 min).
  - Score con `compute_score`, recomendación copiada del tipo y `evidence_key` = type_code.
  - Eventos `created` (actor Sistema o el que reporta), `review` y `dismiss` según corresponda.
  - Inserción en orden cronológico; solo si `alert_repo.count() == 0`.
- [x] T020 [US1] Integrar la siembra en `backend/app/infrastructure/seed/__init__.py` (`seed_all(session)` = catálogos + alertas) y en el lifespan de `backend/app/main.py`.
- [x] T021 [US1] Crear `backend/app/services/alert_service.py` con `AlertService.list(filters, sort, page, page_size)`, que normaliza el atajo `activas` y devuelve vistas con el tipo, la zona y la fuente resueltos y el `incident_id` (vía incident_repo).
- [x] T022 [US1] Crear `backend/app/api/schemas/alerts.py` con `AlertSummaryOut` (ref objects type, zone y source; confidence nullable; incidentId) y `PageOut[T]`; y `backend/app/api/routers/alerts.py` con `GET /alerts` (query: status, severity, zone, type, source, q, from, to, sort, page 1.., pageSize 1..100; los valores desconocidos se ignoran). Registrarlo en `backend/app/main.py`. Añadir además `GET /sources` en `backend/app/api/routers/catalog.py` (`[{id, kind, label, zoneId}]`, ordenado por id; con `list_sources` en el repositorio y servicio de catálogos).
- [x] T023 [P] [US1] Crear `frontend/src/application/hooks/useAlerts.ts` (`useQuery(alerts.list(filters))` con `placeholderData` previo) y `frontend/src/application/hooks/useCatalogs.ts` (`useZones`, `useAlertTypes`, `useSources` (GET /api/sources), `useDismissReasons`, `useTeams`).
- [x] T024 [US1] Crear `frontend/src/presentation/components/FilterBar.tsx`: búsqueda con debounce de 300 ms, MultiSelect de Estado (con "Activas"), Severidad, Zona, Tipo y Fuente, chips removibles y "Limpiar filtros"; controlado por `AlertFilters`.
- [x] T025 [US1] Crear `frontend/src/presentation/features/alerts/AlertTable.tsx`:
  - Columnas del contrato ui-alerts.md, con encabezados ordenables (`aria-sort`).
  - Filas enfocables: ↑ y ↓ mueven el foco, Enter abre el detalle.
  - Resaltado `highlight` de 2 s con `motion-safe`.
  - Fuente legible y confianza con ConfidenceMeter compacto.
- [x] T026 [US1] Crear `frontend/src/presentation/pages/AlertsPage.tsx`:
  - Filtros desde y hacia la URL con `alertFilters.ts`, y paginación.
  - Botón "Reportar evento" (store, T040).
  - Estados Skeleton de tabla, EmptyState "Sin alertas que coincidan" con "Limpiar filtros" y ErrorState con reintento.

  Registrar la ruta `/alertas` en `frontend/src/router.tsx`, sustituyendo el placeholder.

**Checkpoint**: lista priorizada y filtrable con datos reales.

---

## Phase 4: User Story 2 - Detalle y "por qué se priorizó" (P1)

**Independent Test**: quickstart #5, #19, #20 y #28.

- [x] T027 [US2] Añadir a `backend/app/services/alert_service.py`:
  - `get_detail(id)`: la alerta + el tipo (protocolo) + la zona + la fuente + el incidente + `reviewed_by` y `reported_by` resueltos + la timeline con los actores. Si no existe → `DomainError("NO_ENCONTRADO", "La alerta {id} no existe.")`.
  - La etiqueta del motivo de descarte.
- [x] T028 [US2] Añadir a `backend/app/api/schemas/alerts.py` `AlertDetailOut` (scoreBreakdown, recommendation, protocol, evidenceUrl `/evidence/{evidence_key}.svg`, evidenceIsIllustrative true, origin, dismissReason, dismissReasonLabel, dismissComment, reviewedBy, reportedBy, firstActionAt, closedAt, timeline) y `TimelineEventOut`; añadir `GET /alerts/{id}` en `backend/app/api/routers/alerts.py`.
- [x] T029 [P] [US2] Crear las 7 ilustraciones en `frontend/public/evidence/` (`equipaje_abandonado.svg`, `objeto_inusual.svg`, `acceso_restringido.svg`, `comportamiento_anomalo.svg`, `concentracion_personas.svg`, `permanencia_inusual.svg` y `reporte_operador.svg`): viewBox 16:9, estilo plano y sobrio en la paleta navy, gris y brand; **sin personas identificables** (como mucho, siluetas genéricas lejanas sin rasgos); el objeto o patrón de cada tipo dentro del área que define `domain/evidence.ts`.
- [x] T030 [P] [US2] Crear `frontend/src/presentation/components/EvidenceViewer.tsx`: marco de cámara con cabecera (fuente y hora con RelativeTime), la imagen SVG con `alt` descriptivo, el recuadro de detección superpuesto desde `domain/evidence.ts` y la leyenda "Imagen ilustrativa · sin datos personales".
- [x] T031 [P] [US2] Crear `frontend/src/presentation/components/ScoreBreakdown.tsx` (score en una barra de 0 a 100 + los tres factores con su etiqueta y valor; "Confianza: N/A (reporte humano ×1,00)" si es manual; nota "Severidad × confianza × criticidad de zona").
- [x] T032 [P] [US2] Crear `frontend/src/presentation/components/MiniMap2D.tsx` (research R10): SVG de las zonas desde `geometry` (viewBox 120 × 80, Z invertido), color por riskLevel con los tokens de severidad, zona resaltada con borde grueso, nombre de la zona en el resaltado, leyenda de texto y `role="img"` + `aria-label`.
- [x] T033 [P] [US2] Crear `frontend/src/presentation/components/Timeline.tsx` (lista ordenada con un icono por acción, la etiqueta de `domain/timeline.ts`, el actor o "Sistema", el cambio de estado con StatusBadge si aplica, el comentario y la hora relativa).
- [x] T034 [US2] Crear `frontend/src/application/hooks/useAlert.ts` (`useQuery(alerts.detail(id))`, sin reintentar los 404) y `frontend/src/application/hooks/useAutoReview.ts` (research R12: mutación `review` una sola vez con `useRef`; ignora el 409 y refresca el detalle).
- [x] T035 [US2] Crear `frontend/src/presentation/pages/AlertDetailPage.tsx` según contracts/ui-alerts.md (encabezado con el chip "Predicción demostrativa"; columna principal con EvidenceViewer, descripción, ScoreBreakdown, recomendación, protocolo como checklist visual y Timeline; columna lateral con MiniMap2D (zonas de `useZones`), ConfidenceMeter y el panel de acciones de T038); estados Skeleton y ErrorState (404 con un enlace a /alertas). Registrar `/alertas/:id` en `frontend/src/router.tsx`.

**Checkpoint**: el detalle completo funciona y la revisión es automática.

---

## Phase 5: User Story 3 - Confirmar, descartar y comentar (P1)

**Independent Test**: quickstart #6-#11 y #21-#26.

- [x] T036 [US3] Añadir `apply_action(id, command, actor)` a `backend/app/services/alert_service.py`, dentro de una transacción:
  1. Leer la alerta (404 si no existe).
  2. Si `needs_implicit_review`, registrar el `review` implícito (`reviewed_by`, `first_action_at`).
  3. `next_alert_status`. Si es inválido → `DomainError("TRANSICION_INVALIDA")` con un mensaje según el estado: "La alerta {id} ya fue {confirmada|descartada} por {alias} a las {HH:MM}." o "La alerta {id} ya está en revisión.", y `details {currentStatus, lastActor, lastActionAt}` (desde `last_decision_for_alert`).
  4. Aplicar los efectos según la acción:
     - **review**: `reviewed_by` y `first_action_at`.
     - **confirm**: `closed_at` + el incidente nuevo (`next_id`, abierto, `opened_by` y `opened_at`) + los eventos `confirm` (con la nota como comment y payload `{incidentId}`) e `incident_created` (alert_id + incident_id).
     - **dismiss**: valida reason ∈ DismissReason y `comment` ≥ 10 si es `otro` (si no, `DomainError("VALIDACION", …, {fields:[…]})`); guarda dismiss_reason y dismiss_comment, `closed_at` y el evento `dismiss`.
     - **comment**: valida 3..500 y crea el evento `comment`.
  5. Commit. Devolver el detalle y, en confirm, el incidente.
- [x] T037 [US3] Añadir a `backend/app/api/schemas/alerts.py` `AlertActionIn` (unión discriminada por `action`: review | confirm{note ≤ 500} | dismiss{reason: DismissReason, comment?} | comment{comment 3..500}), `IncidentRefOut` y `ConfirmOut {alert, incident}`; y en `backend/app/api/routers/alerts.py` `POST /alerts/{id}/actions` (ActorDep; 201 + ConfirmOut para confirm y 200 + AlertDetailOut para el resto).
- [x] T038 [US3] Crear `frontend/src/application/hooks/useAlertAction.ts` (mutación por acción; `onSuccess` invalida `alerts.all`, `catalog.zones` y el detalle, y lanza los avisos del contrato, con la acción "Ver incidente" en confirm; `onError` muestra un toast con el mensaje del backend y, si es 409, refetch del detalle).
- [x] T039 [US3] Crear en `frontend/src/presentation/features/alerts/`:
  - `ConfirmAlertDialog.tsx`: ConfirmDialog + textarea "Nota (opcional)" ≤ 500.
  - `DismissAlertDialog.tsx`: Dialog con radios de motivo desde `useDismissReasons`, textarea obligatorio de ≥ 10 si el motivo es "otro", errores en línea "Selecciona un motivo" y el botón "Descartar alerta" (danger).
  - `CommentDialog.tsx`: textarea de 3 a 500 con contador.
  - `AlertActionsPanel.tsx`: los botones según `allowedAlertActions(status)`; en `confirmada`, el enlace "Ver incidente INC-xxxx"; en `descartada`, el motivo, el comentario, quién y cuándo; botones con `loading` y deshabilitados mientras procesan.

**Checkpoint**: el ciclo de decisión completo, con trazabilidad.

---

## Phase 6: User Story 4 - Reportar un evento (P2)

**Independent Test**: quickstart #12 y #27.

- [x] T040 [US4] Añadir `report_manual(body, actor)` a `backend/app/services/alert_service.py`:
  - Valida que el tipo y la zona existan (si no, `VALIDACION` con fields) y la descripción de 10 a 500.
  - Crea la alerta con fuente `MANUAL`, origin `manual`, confidence None, la severidad elegida, score con `compute_score(..., None, criticidad)`, `reported_by` = actor y la recomendación del tipo.
  - Inserta el evento `created` con el actor.
- [x] T041 [US4] Añadir `ManualAlertIn` (typeCode, zoneId, severity: Severity, description 10..500) a `backend/app/api/schemas/alerts.py` y `POST /alerts` (201 AlertDetailOut, ActorDep) a `backend/app/api/routers/alerts.py`.
- [x] T042 [P] [US4] Crear `frontend/src/application/stores/reportEvent.ts` (`openReportEvent`, `closeReportEvent`, `useReportEventOpen`) y `frontend/src/application/hooks/useReportEvent.ts` (mutación: en `onSuccess` invalida alerts y zonas, toast "Evento reportado como ALT-xxxx" y devuelve el id).
- [x] T043 [US4] Crear `frontend/src/presentation/features/alerts/ReportEventDialog.tsx` (campos y validación en línea del contrato; preselecciona la severidad por defecto del tipo; "Reportar" deshabilitado si es inválido; tras el éxito, cierra y navega a `/alertas?highlight=ALT-xxxx`); montarlo una vez en `frontend/src/presentation/layout/Shell.tsx`; habilitar el botón "Reportar evento" en `frontend/src/presentation/layout/Topbar.tsx` (sin tooltip de "próxima versión") y conectar el botón de AlertsPage.

**Checkpoint**: reporte manual extremo a extremo.

---

## Phase 7: User Story 5 - Riesgo real por zona (P3)

**Independent Test**: quickstart #13.

- [x] T044 [US5] Cambiar `list_zones()` en `backend/app/services/catalog_service.py` para que use `alert_repo.active_counts_by_zone()`: `risk_level` = la severidad de mayor orden entre las activas (o `normal`) y `active_alerts` = su número. El servicio no debe importar repositorios de otra forma que la ya establecida.

---

## Phase 8: Polish & cross-cutting

- [x] T045 [P] Revisar el microcopy (doc 09 §8: sin certeza, etiquetas legibles de estados y acciones) en el backend (plantillas y mensajes) y en el frontend.
- [x] T046 [P] Revisar la accesibilidad de la lista, el detalle y los diálogos (orden de Tab, `aria-sort`, `aria-live` de los toasts, foco al abrir y cerrar diálogos, contraste) y la vista tablet (detalle en 1 columna con las acciones visibles).
- [x] T047 Ejecutar `cd backend; uv run ruff check . ; uv run ruff format .` y `cd frontend; bun run lint ; bunx tsc --noEmit ; bun run build` hasta tener 0 errores.
- [x] T048 Revisión del agente `layer-guardian` y aplicación de los hallazgos bloqueantes e importantes.
- [x] T049 **Verificación manual**: `specs/002-alertas/quickstart.md` #1-#29 (con una base nueva) y, del checklist del doc 11 §3, HU-04, HU-06 y HU-10 a HU-15, más las reglas "acción sobre estado final → 409 legible" y "el score coincide con su desglose". Anotar el resultado en `specs/002-alertas/checklists/requirements.md`.

---

## Dependencies & Execution Order

- F1 → F2 → historias.
- US1 (F3) depende de F2. US2 (F4) depende de US1 (la navegación desde la lista y el servicio). US3 (F5) depende de US2 (el panel vive en el detalle). US4 (F6) depende de F2 y de T026 (botón en AlertsPage). US5 (F7) depende de F2 y de T008.
- Backend y frontend avanzan en paralelo dentro de cada fase.

## Parallel Opportunities

- F2: T002-T005 en paralelo; en el front, T012-T015 y T017 en paralelo.
- US2: T029-T033 (componentes y SVG) en paralelo.
- `backend-engineer` (T002-T011, T018-T022, T027-T028, T036-T037, T040-T041, T044) en paralelo con `frontend-engineer` (T012-T017, T023-T026, T029-T035, T038-T039, T042-T043).

## Implementation Strategy

1. MVP: F2 + US1 (lista priorizada con datos sembrados).
2. + US2 + US3: el flujo de decisión completo (lo central de la demo).
3. + US4 + US5 + Polish + verificación → commit `feat(002-alertas): …`.
