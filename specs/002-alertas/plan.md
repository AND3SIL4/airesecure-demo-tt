# Implementation Plan: Gestión de alertas

**Branch**: `002-alertas` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-alertas/spec.md`

## Summary

Implementar el dominio de alerta (máquina de estados con revisión implícita, score explicable), las tablas `alerts`, `incidents` y `timeline_events`, la siembra de alertas relativa a "ahora" y la API de consulta, detalle, acciones y reporte manual, con mensajes 422 en español. También el riesgo real por zona y, en el frontend, la lista de alertas filtrable (URL), el detalle con la evidencia SVG, el desglose del score, el plano 2D, la timeline y las acciones con diálogos, y el modal global "Reportar evento". Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.12 · TypeScript 5 (strict) con React 18.3

**Primary Dependencies**: las mismas de la feature 001; **no se añade ninguna dependencia**.

**Storage**: SQLite; tablas nuevas `alerts`, `incidents` y `timeline_events` ([data-model.md](data-model.md))

**Testing**: ninguno (constitución VIII); [quickstart.md](quickstart.md) manual

**Target Platform**: Windows 11 local; Chrome y Edge

**Project Type**: aplicación web (monorepo backend + frontend)

**Performance Goals**: lista y detalle en < 1 s con unas 20 alertas sembradas

**Constraints**: un solo proceso; escrituras serializadas por SQLite; coste cero

**Scale/Scope**: 18 alertas sembradas; 4 endpoints nuevos y 1 modificado; 2 vistas y 1 modal; 7 SVG

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Estado |
|---|---|---|
| I. Documentación | Todas las reglas citan los docs 05, 07, 08, 09 y 10. Desviaciones documentadas: la columna `dismiss_comment` (se añade al doc 07) | ✅ |
| II. Capas | Transiciones y score en `domain`; orquestación y transacción en `services`; consultas en `repositories`; DTOs y errores en `api`. Front: hooks en `application`; el componente nunca llama a fetch | ✅ |
| III. Humano en el bucle | Confirmar y descartar con diálogo; revisión implícita registrada; timeline en la misma transacción; el incidente solo se crea por confirmación humana | ✅ |
| IV. Transparencia | Chip "Predicción demostrativa", desglose del score, leyenda "Imagen ilustrativa", microcopy sin certeza | ✅ |
| V. Privacidad | SVG sin personas identificables; alias ficticios | ✅ |
| VI. Accesibilidad | Tabla navegable con teclado, `aria-sort`, diálogos nativos, badges con icono y texto, estados de UI, `motion-safe` | ✅ |
| VII. Simplicidad | Sin dependencias nuevas; SVG propios; plano 2D propio | ✅ |
| VIII. Sin pruebas | Sin tareas de pruebas | ✅ |
| IX. Un comando | La siembra de alertas es automática en el arranque | ✅ |
| X. Idioma | UI y mensajes de error y validación en español; código en inglés | ✅ |

**Re-check post-design**: ✅ sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/002-alertas/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/ (api-alerts.md, ui-alerts.md)
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/app/
├── domain/
│   ├── enums.py            # + AlertStatus, IncidentStatus, AlertOrigin, AlertAction, TimelineAction
│   ├── models.py           # + Alert, Incident, TimelineEvent (+ índices)
│   ├── state_machine.py    # NUEVO: transiciones de la alerta y revisión implícita
│   ├── scoring.py          # NUEVO: compute_score → ScoreBreakdown
│   ├── time.py             # NUEVO: BOGOTA_TZ, format_local_time
│   └── catalogs.py         # + SEVERITY_ORDER (ya existe) reutilizado para riskLevel
├── repositories/
│   ├── alert_repo.py       # NUEVO: get, list(filters, sort, page), add, next_id, active_by_zone
│   ├── incident_repo.py    # NUEVO: add, next_id, get_by_alert
│   └── timeline_repo.py    # NUEVO: add, list_for_alert, last_for_alert
├── services/
│   ├── alert_service.py    # NUEVO: list, get_detail, apply_action, report_manual, create_from_event
│   └── catalog_service.py  # list_zones con riesgo real
├── api/
│   ├── schemas/alerts.py   # NUEVO: AlertSummaryOut, AlertDetailOut, TimelineEventOut, AlertActionIn (unión), ManualAlertIn, ConfirmOut, PageOut
│   ├── routers/alerts.py   # NUEVO
│   └── errors.py           # + traducción 422 al español
└── infrastructure/seed/
    ├── texts.py            # NUEVO: plantillas del doc 10 §5
    ├── alerts.py           # NUEVO: seed_alerts(session, now)
    └── __init__.py         # seed_all: catálogos + alertas (si está vacía)

frontend/
├── public/evidence/*.svg   # NUEVO: 7 ilustraciones
└── src/
    ├── domain/  types.ts (+ Alert*, TimelineEvent, Page) · alertFilters.ts · evidence.ts · format.ts (+ relativeTime) · status.ts (+ allowedAlertActions) · timeline.ts (etiquetas de acciones)
    ├── infrastructure/api/alerts.ts
    ├── application/ queryKeys.ts (+ alerts) · hooks/useAlerts.ts · useAlert.ts · useAlertAction.ts · useAutoReview.ts · useReportEvent.ts · useCatalogs.ts · stores/reportEvent.ts
    └── presentation/
        ├── components/ FilterBar · MultiSelect · Pagination · ConfidenceMeter · ScoreBreakdown · EvidenceViewer · MiniMap2D · Timeline · RelativeTime
        ├── features/alerts/ AlertTable · AlertActionsPanel · ConfirmAlertDialog · DismissAlertDialog · CommentDialog · ReportEventDialog
        ├── pages/ AlertsPage.tsx · AlertDetailPage.tsx
        └── layout/ Topbar (Reportar evento habilitado) · Shell (monta ReportEventDialog)
```

**Structure Decision**: se mantiene el monorepo de la feature 001. Se añade `presentation/features/alerts/` para los componentes específicos de alertas, y `presentation/components/` sigue reservado para los genéricos y reutilizables.

## Complexity Tracking

No aplica.
