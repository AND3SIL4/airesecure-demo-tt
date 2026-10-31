# Implementation Plan: Análisis y reportes

**Branch**: `007-analisis-reportes` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

El backend añade:
- `/api/analytics/*`: by-zone, by-type, trend, times, outcomes y anomalies, con `days` = 7, 14 o 30 (si no, 30), sobre `AnalyticsService` y los conteos de los repositorios, reutilizando el detector de anomalías de la 005.
- `/api/reports/incidents.csv` (solo supervisor) con `ReportService`, que reutiliza los filtros de `IncidentService`. El formateo del CSV va en `domain/csv_report.py`: columnas, formato de fechas de Bogotá y minutos.

El frontend añade:
- `AnalysisPage`: grilla de 2×3 con Recharts, cada bloque con su propia query para aislar errores.
- `ReportsPage`: filtros de incidentes reutilizados, vista previa con `useIncidents` de 10 filas y descarga.
- El botón "Exportar CSV" en `IncidentsPage` (solo supervisor).
- La descarga se hace con un `fetch` en `infrastructure/download.ts`, con la cabecera `X-Actor-Id` y un blob que se guarda con un `<a download>` temporal.

## Technical Context

Sin dependencias nuevas · Python 3.12 / TS 5 · solo lectura (salvo el CSV, que también es lectura) · sin pruebas; [quickstart.md](quickstart.md).

## Decisions

- **R1. Analítica.**
  - `services/analytics_service.py` con un método por endpoint. "Incidentes en el rango" se toma por `opened_at ≥ now − days`.
  - `trend` tiene un elemento por día (fecha de Bogotá, de `days` días, rellenando con 0) con el total y el desglose por severidad.
  - `times` usa los incidentes del rango: media de `response_seconds` y de `resolution_seconds` (estos solo de los resueltos), más `byDay`.
  - `outcomes` usa las alertas detectadas en el rango: confirmadas, descartadas, tasa = c/(c+d) y `belowThreshold` (setting acumulado).
  - `anomalies` es el mismo cálculo que el resumen y se extrae a un método compartido del servicio.
- **R2. Repositorios.** Agregaciones con GROUP BY:
  - `incident_repo`: `counts_by_zone_opened_since`, `counts_by_type_opened_since` (ya existe), `daily_by_severity_since`, `avg_times_since` y `daily_times_since`.
  - `alert_repo`: `outcome_counts_since`.
  - Agrupación por día de Bogotá: `date(datetime(opened_at, '-5 hours'))` en SQLite (UTC-5 fijo).
- **R3. CSV.**
  - `domain/csv_report.py`: `HEADERS`, `row_for(incident_view)` y `to_csv(rows) -> str`, con el módulo `csv` estándar y `QUOTE_MINIMAL`.
  - El router devuelve `Response(content='﻿' + csv, media_type='text/csv; charset=utf-8', headers={'Content-Disposition': 'attachment; filename="incidentes-AAAAMMDD-HHMM.csv"'})`.
  - Los filtros son los de `/incidents`, sin paginar (máximo 5000 filas).
- **R4. Frontend.**
  - `domain/analytics.ts`: títulos-pregunta, resúmenes accesibles, formato y rango (`?days=`).
  - `infrastructure/api/analytics.ts` y `infrastructure/download.ts` (`downloadFile(url, filename)` con la cabecera del actor).
  - Hooks: `useAnalytics*` y `useDownloadIncidentsCsv`.
  - `presentation/features/analysis/`: `ByZoneChart` (barras horizontales), `ByTypeChart`, `DailyTrendChart` (área apilada por severidad), `OutcomesDonut`, `TimesPanel` (2 KPIs + línea) y reutilizar `AnomaliesList`.
  - `presentation/features/reports/ReportPreview.tsx`.
  - Páginas `AnalysisPage` y `ReportsPage`. Botón en `IncidentsPage`.

## Constitution Check

| Principio | Estado |
|---|---|
| II. Capas | ✅ Formateo del CSV en domain; agregaciones en repositories; el router solo serializa |
| III. Supervisor | ✅ CSV con `SupervisorDep`; botón oculto al operador |
| IV. Transparencia | ✅ Anomalías etiquetadas; "bajo umbral" explicado |
| VI. Accesibilidad | ✅ Gráficos con título, tooltip y resumen; botones con estados |
| VII-VIII | ✅ Sin dependencias ni tests |

## Project Structure

```text
backend/app/domain/csv_report.py
backend/app/repositories/{incident_repo.py (+), alert_repo.py (+)}
backend/app/services/{analytics_service.py, report_service.py, dashboard_service.py (usa la anomalía compartida)}
backend/app/api/{schemas/analytics.py, routers/analytics.py, routers/reports.py}; main.py
frontend/src/domain/analytics.ts
frontend/src/infrastructure/{api/analytics.ts, download.ts}
frontend/src/application/hooks/{useAnalytics.ts, useDownloadIncidentsCsv.ts}; queryKeys (+ analytics)
frontend/src/presentation/features/{analysis/*, reports/ReportPreview.tsx}
frontend/src/presentation/pages/{AnalysisPage.tsx, ReportsPage.tsx, IncidentsPage.tsx (+ botón)}; router.tsx
```
