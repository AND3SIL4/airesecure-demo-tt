# Research: 004-incidentes

## R1. Máquina de estados del incidente
- **Decision**: ampliar `domain/state_machine.py` con `INCIDENT_ALLOWED_FROM`:
  - `assign`: {abierto, en_atencion, escalado}
  - `start`: {abierto, escalado}
  - `escalate`: {abierto, en_atencion}
  - `resolve`: {en_atencion, escalado}
  - `comment`: todos

  También `next_incident_status(current, action)` (assign y comment conservan el estado). Las validaciones de contenido van en `domain/incident_rules.py`: motivo ≥ 10, nota ≥ 10, comentario 3..500 y equipo especializado para escalar. `start` sin equipo → `DomainError("EQUIPO_REQUERIDO", "Asigna un equipo antes de iniciar la atención.")` (422, ya mapeado).
- **Rationale**: simétrico con la alerta (feature 002) y reglas puras en `domain`.

## R2. Tiempos
- **Decision**: `response_seconds` se fija **al crear el incidente** (en confirm), como `alert.first_action_at − alert.detected_at`, porque la primera acción humana ya ocurrió. `resolution_seconds` se fija al resolver, como `resolved_at − alert.detected_at` (doc 05 §6). Se ajusta `AlertService._confirm`.
- **Rationale**: permite ordenar por tiempo de respuesta también los incidentes en curso.

## R3. Consultas con JOIN
- **Decision**: `IncidentRepository.list(filters, sort, page)` hace JOIN con `alerts` para filtrar por severidad, zona y tipo, y buscar en `incidents.id`, `alerts.id` o `alerts.description`. Orden: `openedAt` (por defecto, desc), `severity` (CASE por orden) y `responseSeconds` (los nulos al final). El rango se aplica sobre `opened_at`. Además, `counts_in_course()`.
- **Rationale**: la severidad no se duplica en `incidents` (doc 07).

## R4. Historia combinada
- **Decision**: `TimelineRepository.list_for_incident_combined(incident_id, alert_id)` devuelve los eventos con `alert_id = X` **o** `incident_id = Y`, en orden ascendente por (`created_at`, `id`), sin duplicados (`incident_created` tiene ambos ids).

## R5. Eventos en vivo
- **Decision**: `IncidentService.apply_action` publica tras el commit `incident.updated {id, status, actorId}`. El frontend ya invalida `['incidents']`; se alinea `queryKeys.incidents.all = ['incidents']` y se añade `incidents.counts`.

## R6. Siembra cronológica
- **Decision**: se reorganiza `infrastructure/seed/` con un patrón de dos pasos:
  1. **Planificar** registros (dataclasses `PlannedAlert` con su posible `PlannedIncident` y sus eventos relativos) desde `seed/history.py` (30 días), `seed/today.py` (los 6 resueltos y los 3 en curso de hoy) y la planificación existente de `seed/alerts.py` (12 activas, las descartadas de hoy y la anomalía).
  2. **Materializar**: ordenar todas las alertas por `detected_at`, asignar `ALT-2001…`, ordenar los incidentes por `opened_at`, asignar `INC-0401…` e insertar con `session.add`.

  Detalles:
  - `random.Random(2048)` para que los datos sean reproducibles.
  - Distribución horaria por pesos (picos de 06-09 h y 17-20 h).
  - Tendencia: +15 % en los últimos 7 días.
  - Severidad de las confirmadas: 8 % crítica, 22 % alta, 45 % media y 25 % baja (ajustando el tipo según su severidad por defecto).
  - Zonas ponderadas (Sala de embarque A, Hall, Filtro de seguridad y Sala de equipajes más frecuentes) dentro de la compatibilidad de `domain/simulation.py`.
  - ≈ 10 % escalados al equipo especializado según el tipo: equipaje u objeto → EOD; acceso o comportamiento → Policía; el resto → Médico (solo los equipos especializados pueden recibir escalamientos).
  - Actores: op-01/op-02 el 90 % y sup-a el 10 %.
  - Eventos completos: created → review → confirm → incident_created → assign → start → [escalate] → resolve.
  - Las descartadas llevan created → review → dismiss con un motivo variado.
- **Rationale**: es FR-008 y SC-004/005. Los IDs quedan en orden cronológico, como prometía la feature 002 (research R8).

## R7. UI de incidentes
- **Decision**:
  - `presentation/features/incidents/`: `IncidentTable`, `IncidentFilterBar` (reutiliza `MultiSelect` y añade `DateRangePresets` en `components/`), `IncidentActionsPanel`, `AssignTeamDialog`, `EscalateIncidentDialog` y `ResolveIncidentDialog`.
  - `CommentDialog` se reutiliza: se generaliza su `onSubmit` si hace falta.
  - Las páginas `IncidentsPage` e `IncidentDetailPage` sustituyen los placeholders.
  - Los filtros viven en la URL (`domain/incidentFilters.ts`).
  - Las columnas siguen el doc 09 §3.5; los tiempos se formatean como "4 min" o "1 h 12 min" (`domain/format.ts::formatDuration`).
