---
description: "Lista de tareas de la feature 005-resumen"
---

# Tasks: Resumen operativo

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Phase 1: Setup
- [x] T001 Instalar `recharts` en `frontend/` con `bun add recharts` (dependencia aprobada) y verificar el build.

## Phase 2: Foundational (backend)
- [x] T002 [P] Ampliar `backend/app/domain/time.py` con `bogota_day_start(now)` y `same_window_yesterday(now)`; crear `backend/app/domain/metrics.py` con `delta(today, yesterday)` (pct, abs o none; research R2 del plan).
- [x] T003 [P] Crear `backend/app/domain/anomalies.py` (`Anomaly` y `detect(...)` según plan R3: mínimo de referencia 1,0, `min_count` 3 y factor 1,5; etiquetas en español).
- [x] T004 Ampliar `backend/app/repositories/alert_repo.py` (`count_detected_between`, `counts_by_hour`, `counts_by_zone`, `counts_by_type`) y `backend/app/repositories/incident_repo.py` (`count_opened_between`, `count_resolved_between`, `avg_response_between`, `counts_by_type_opened_since`).

## Phase 3: US1 + US2 + US3 backend (P1/P2)
- [x] T005 [US1] Crear `backend/app/services/dashboard_service.py` con `DashboardService.summary(now)`: KPIs, deltas, el top 6 (reutilizando `AlertService.list` con `activas`), zonas (riesgo y activas), los marcadores de alertas activas, `byCategory7d`, `trend24h` (24 horas en Bogotá, rellenando con 0) y anomalías.
- [x] T006 [US1] Crear `backend/app/api/schemas/dashboard.py` y `backend/app/api/routers/dashboard.py` (`GET /dashboard/summary`, contrato `contracts/api-dashboard.md`) y registrarlos en `main.py`.

## Phase 4: US1 + US2 frontend (P1)
- [x] T007 [P] [US1] Ampliar `frontend/src/domain/types.ts` (`DashboardSummary`, `Delta`, `Anomaly`, `ZoneStatus`, `AlertMarker`) y crear `frontend/src/domain/kpis.ts` (definición de los 5 KPI: etiqueta, icono, `higherIsWorse`, formato y texto accesible de la variación).
- [x] T008 [P] [US1] Crear `frontend/src/infrastructure/api/dashboard.ts` y añadir `getCriticalTotal` en `infrastructure/api/alerts.ts`; ampliar `application/queryKeys.ts` (`dashboard.summary` bajo `dashboard.all` y `alerts.criticalCount` bajo `alerts.all`); crear los hooks `useDashboard.ts` y `useCriticalCount.ts`.
- [x] T009 [US1] Crear `frontend/src/presentation/features/summary/KpiRow.tsx` (5 KpiCard con la variación: flecha, color semántico y texto; en "none", "Sin datos de ayer") y `PriorityAlerts.tsx` (6 filas accesibles con SeverityBadge, tipo, zona, RelativeTime, Link y "Ver todas").
- [x] T010 [US2] Ampliar `frontend/src/presentation/components/MiniMap2D.tsx` con `markers` (punto por alerta con el color de su severidad y un `<title>`, distribuidos dentro de la zona) y `onZoneClick` (zonas focusables con Enter); en el Resumen, el clic navega a `/alertas?status=activas&zone=…`.
- [x] T011 [US2] Habilitar "Críticas (N)" en `frontend/src/presentation/layout/Topbar.tsx` (`useCriticalCount`; resaltado con `sev-critica` si N > 0; Link a `/alertas?status=activas&severity=critica`; `aria-label` "N alertas críticas activas").

## Phase 5: US3 frontend (P2)
- [x] T012 [P] [US3] Crear `frontend/src/presentation/features/summary/CategoryDonut.tsx` (Recharts PieChart con el total al centro, tooltip, leyenda con texto y `aria-label` de resumen; título "¿Qué tipos de incidente predominan? (7 días)") y `Trend24h.tsx` (LineChart de 24 puntos con eje de horas en Bogotá; título "¿Cómo evolucionan las alertas? (24 h)").
- [x] T013 [P] [US3] Crear `frontend/src/presentation/features/summary/AnomaliesList.tsx` (filas con el icono `trending-up`, la etiqueta, "N en la última hora · referencia X/h · +Y %", la etiqueta "Detección basada en reglas · demostrativa" y el vacío "Sin anomalías detectadas").
- [x] T014 [US1] Crear `frontend/src/presentation/pages/SummaryPage.tsx` con el layout del doc 09 §3.2 (fila de KPIs; fila con prioritarias 7/12 y mini-mapa 5/12; fila con dona, tendencia y anomalías), los estados de carga, error y vacío, y registrarla en el índice de `router.tsx`; retirar `showComponentPreview` de `PlaceholderPage.tsx`.

## Phase 6: Polish
- [x] T015 [P] Documentar: doc 05 §6 (definición de la variación por KPI) y §7 (mínimo de referencia 1/h), doc 08 §3.2 (contrato del resumen) y doc 10 §4 (la anomalía se muestra con la variación calculada por la regla, no un valor fijo).
- [x] T016 Linters y build sin errores.
- [x] T017 Revisión del agente `layer-guardian` y corrección de los hallazgos bloqueantes e importantes.
- [x] T018 **Verificación manual**: quickstart #1-#11 y HU-03, HU-04, HU-07 y HU-09 del doc 11 §3; anotar el resultado en `checklists/requirements.md`.
