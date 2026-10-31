# Implementation Plan: Gestión de incidentes e historial

**Branch**: `004-incidentes` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

## Summary

Completar el ciclo de vida del incidente (máquina de estados, validaciones y tiempos), su API (lista con JOIN a la alerta, detalle con historia combinada y acciones con eventos en vivo), la siembra cronológica del histórico de 30 días y de los incidentes de hoy, y la UI de registro y detalle con diálogos de asignar, escalar y resolver, más el badge de incidentes en curso. Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.12 · TypeScript 5 / React 18.3 · **Dependencias**: sin cambios · **Storage**: SQLite (sin tablas nuevas) · **Testing**: ninguno; [quickstart.md](quickstart.md) · **Platform**: Windows 11, Chrome y Edge · **Performance**: registro de unos 160 incidentes en < 1 s · **Scale**: unas 240 alertas y 160 incidentes sembrados

## Constitution Check

| Principio | Cumplimiento | Estado |
|---|---|---|
| I. Documentación | Se citan los docs 04, 05, 07, 08, 09 y 10. Se documenta: `en_curso` como atajo, `response_seconds` al crear y la historia combinada (doc 08) | ✅ |
| II. Capas | Transiciones y reglas en domain; IncidentService (transacción y eventos) en services; JOIN en repositories; la semilla no importa repositories | ✅ |
| III. Humano en el bucle | Escalar y resolver con confirmación; toda acción queda en la historia con su actor | ✅ |
| IV-V | Sin cambios de transparencia ni privacidad; actores ficticios en la semilla | ✅ |
| VI. Accesibilidad | Tooltips en los botones deshabilitados, diálogos nativos, tabla con teclado, foco tras la acción y badges con texto | ✅ |
| VII-X | Sin dependencias, sin tests, siembra automática, textos en español | ✅ |

## Project Structure

```text
backend/app/
├── domain/        state_machine.py (+ incidente) · incident_rules.py (NUEVO)
├── repositories/  incident_repo.py (list con JOIN, get, save, counts_in_course) · timeline_repo.py (+ combinada, last_decision_for_incident)
├── services/      incident_service.py (NUEVO: list, get_detail, apply_action con eventos) · alert_service.py (response_seconds al confirmar)
├── api/           schemas/incidents.py (NUEVO) · routers/incidents.py (NUEVO) · main.py
└── infrastructure/seed/ plan.py (NUEVO: PlannedAlert e incidentes, y materialize) · history.py (NUEVO) · today.py (NUEVO) · alerts.py (adaptado a planificar) · __init__.py

frontend/src/
├── domain/        types.ts (+ Incident, IncidentActionBody) · incidentFilters.ts · status.ts (+ allowedIncidentActions) · format.ts (+ formatDuration)
├── infrastructure/api/incidents.ts
├── application/   queryKeys (incidents.all = ['incidents'], list, detail, counts) · hooks/useIncidents · useIncident · useIncidentAction · useIncidentCounts
└── presentation/  components/DateRangePresets.tsx · features/incidents/{IncidentTable, IncidentFilterBar, IncidentActionsPanel, AssignTeamDialog, EscalateIncidentDialog, ResolveIncidentDialog} · pages/{IncidentsPage, IncidentDetailPage} · layout/Sidebar (badge) · router.tsx
```

## Complexity Tracking

No aplica.
