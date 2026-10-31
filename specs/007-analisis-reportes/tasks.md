---
description: "Lista de tareas de la feature 007-analisis-reportes"
---

# Tasks: Análisis y reportes

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Phase 1: Backend
- [x] T001 [P] Crear `backend/app/domain/csv_report.py` (las cabeceras del contrato, `row_for(...)` con las etiquetas legibles, las fechas de Bogotá en formato `YYYY-MM-DD HH:MM` y los minutos con 1 decimal, y `to_csv(rows)` con el módulo `csv`).
- [x] T002 Ampliar `backend/app/repositories/incident_repo.py` (`counts_by_zone_opened_since`, `daily_by_severity_since`, `avg_times_since`, `daily_times_since` y `list_all(filters, max_rows=5000)`) y `backend/app/repositories/alert_repo.py` (`outcome_counts_since`), con la agrupación por día de Bogotá (plan R2).
- [x] T003 Crear `backend/app/services/analytics_service.py` (plan R1). Extraer el cálculo de anomalías a un método compartido que también use `dashboard_service.py`.
- [x] T004 Crear `backend/app/services/report_service.py` (`incidents_csv(query) -> (filename, content)`, que reutiliza la normalización de filtros de `IncidentService`).
- [x] T005 Crear `backend/app/api/schemas/analytics.py`, `backend/app/api/routers/analytics.py` (6 GET) y `backend/app/api/routers/reports.py` (CSV con `SupervisorDep`, BOM y `Content-Disposition`); registrarlos en `main.py`.

## Phase 2: Frontend
- [x] T006 [P] Crear `frontend/src/domain/analytics.ts` (títulos-pregunta: "¿Dónde ocurren más incidentes?", "¿Qué tipos predominan?", "¿Cómo evolucionan por severidad?", "¿Cuántas alertas se confirman?", "¿Cuánto tardamos en responder y resolver?" y "¿Hay comportamientos inusuales?"; los resúmenes accesibles; `parseDays` con 7, 14 o 30, por defecto 30) y los tipos en `domain/types.ts`.
- [x] T007 [P] Crear `frontend/src/infrastructure/api/analytics.ts` y `frontend/src/infrastructure/download.ts` (`downloadFile(url, fallbackName)`: fetch con `X-Actor-Id`, nombre tomado de `Content-Disposition`, blob y un `<a download>` temporal; los errores se convierten en ApiError).
- [x] T008 Crear `frontend/src/application/hooks/useAnalytics.ts` (un hook por bloque con las claves `analytics.*(days)` bajo `analytics.all`, invalidadas por `useLiveEvents` en los eventos de incidentes y alertas) y `useDownloadIncidentsCsv.ts` (mutación que muestra un toast si hay error).
- [x] T009 Crear `frontend/src/presentation/features/analysis/` (`ByZoneChart`, `ByTypeChart`, `DailyTrendChart`, `OutcomesDonut` con la nota "Eventos bajo umbral acumulados: N" y `TimesPanel`) y `frontend/src/presentation/pages/AnalysisPage.tsx` (selector 7/14/30 en la URL, grilla de 2×3, un estado por bloque y `AnomaliesList` reutilizada). Registrar `/analisis`.
- [x] T010 Crear `frontend/src/presentation/features/reports/ReportPreview.tsx` y `frontend/src/presentation/pages/ReportsPage.tsx` (supervisor: reutiliza `IncidentFilterBar` y `incidentFilters`; vista previa de 10 filas con el total; "Descargar CSV" deshabilitado con el tooltip "No hay incidentes para exportar" si el total es 0). Registrar `/reportes` dentro de `RequireSupervisor`.
- [x] T011 Añadir "Exportar CSV" en `frontend/src/presentation/pages/IncidentsPage.tsx`, solo si el rol es supervisor y con los filtros activos.

## Phase 3: Polish
- [x] T012 Documentar en el doc 08 §3.5 el contrato detallado (con un enlace al contrato de la feature) y en el doc 09 §3.8 los títulos de los gráficos.
- [x] T013 Linters y build sin errores.
- [x] T014 Revisión del agente `layer-guardian`, aplicando los hallazgos bloqueantes e importantes.
- [x] T015 **Verificación manual**: quickstart #1-#10 y HU-22 a HU-25 del doc 11 §3; anotar el resultado en `checklists/requirements.md`.
