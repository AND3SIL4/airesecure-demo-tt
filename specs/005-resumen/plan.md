# Implementation Plan: Resumen operativo

**Branch**: `005-resumen` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

Backend: `GET /api/dashboard/summary`, que compone KPIs, variaciones, top 6, estado de zonas, distribución por tipo (7 días), tendencia de 24 h y anomalías (regla pura en `domain/anomalies.py`). Frontend: `SummaryPage` con KpiCard, alertas prioritarias, `MiniMap2D` con marcadores y clic por zona, dona y línea con **Recharts** (dependencia aprobada) y la lista de anomalías; el botón "Críticas (N)" queda habilitado. Se retira la vista previa de componentes.

## Technical Context

**Language/Version**: Python 3.12 · TS 5 / React 18.3

**Primary Dependencies**: + `recharts` (frontend, aprobada en la constitución; justificación: gráficos del Resumen y de Análisis)

**Storage**: SQLite (solo lectura)

**Testing**: ninguno; [quickstart.md](quickstart.md)

**Performance**: resumen en < 1 s con unas 250 alertas

## Research / Decisions

- **R1. Ventanas temporales.** `domain/time.py` gana `bogota_day_start(now)` y `same_window_yesterday(now) -> (start, end)`. Hoy va de las 00:00 de Bogotá hasta ahora; ayer, de las 00:00 de ayer a la misma hora de ayer.
- **R2. Variaciones.** `domain/metrics.py::delta(today, yesterday) -> {value, previous, kind: 'pct' | 'abs' | 'none'}`: con `yesterday is None` se marca 'none' ("Sin datos de ayer"); con `yesterday == 0` y hoy > 0 se usa 'abs'; en el resto, 'pct' redondeado. La semántica (mejor o peor) la decide el frontend por KPI (`domain/kpis.ts`).
- **R3. Anomalías.** `domain/anomalies.py::detect(recent_counts, weekly_counts, hours=168, min_baseline=1.0, min_count=3, factor=1.5) -> list[Anomaly]`, con funciones puras sobre los conteos. El repositorio aporta los conteos agrupados por zona y por tipo en las dos ventanas (60 min y 7 días). Etiquetas en español: "Aumento inusual · {zona}" y "Aumento inusual · {tipo}".
- **R4. Consultas.** `AlertRepository` gana `count_detected_between(start, end, severity=None)`, `counts_by_hour(since)`, `counts_by_zone(since)` y `counts_by_type(since)`. `IncidentRepository` gana `count_opened_between`, `count_resolved_between`, `avg_response_between` y `counts_by_type_opened_since(since)` (JOIN a alerts). Se reutiliza `counts_in_course`.
- **R5. Servicio.** `services/dashboard_service.py::DashboardService.summary(now)` es de solo lectura, compone los DTO del servicio y reutiliza `AlertService.list` para el top 6 (con el orden por score de la lista de activas).
- **R6. Frontend.**
  - `presentation/features/summary/`: `KpiRow`, `PriorityAlerts`, `CategoryDonut` (Recharts PieChart con el total al centro), `Trend24h` (LineChart) y `AnomaliesList`.
  - `MiniMap2D` acepta `markers` y `onZoneClick` (ya prevé los marcadores).
  - `useDashboard()` usa la clave `dashboard.all` (ya invalidada por `useLiveEvents`).
  - "Críticas (N)": `useCriticalCount()` llama a `GET /api/alerts?status=activas&severity=critica&pageSize=1`, con la clave `alerts.criticalCount` bajo `alerts.all`, y navega a `/alertas?status=activas&severity=critica`.
  - Los colores de los gráficos usan los tokens de severidad y la paleta brand para los tipos, con contraste AA. Cada gráfico tiene un `aria-label` con su resumen textual.

## Constitution Check

| Principio | Estado |
|---|---|
| I. Documentación | ✅ Se documentan las definiciones de delta y el mínimo de referencia de anomalías (docs 05 §6-§7 y 10 §4) |
| II. Capas | ✅ Reglas en domain; composición en el servicio; consultas en repositories; el front, por capas |
| IV. Transparencia | ✅ Anomalías etiquetadas "Detección basada en reglas · demostrativa" |
| VI. Accesibilidad | ✅ Variaciones con texto; gráficos con título, resumen y tooltips; mapa con `role="img"` y alternativa textual |
| VII. Simplicidad | ✅ Solo Recharts, que es una dependencia aprobada |
| VIII. Sin pruebas | ✅ |

## Project Structure

```text
backend/app/domain/{time.py (+), metrics.py, anomalies.py}
backend/app/repositories/{alert_repo.py (+), incident_repo.py (+)}
backend/app/services/dashboard_service.py
backend/app/api/{schemas/dashboard.py, routers/dashboard.py}; main.py
frontend/src/domain/{types.ts (+ DashboardSummary, Anomaly, Delta), kpis.ts}
frontend/src/infrastructure/api/dashboard.ts (+ getCriticalTotal en alerts.ts)
frontend/src/application/{queryKeys.ts (+), hooks/useDashboard.ts, hooks/useCriticalCount.ts}
frontend/src/presentation/{features/summary/*, pages/SummaryPage.tsx, components/MiniMap2D.tsx (+ markers/onZoneClick), layout/Topbar.tsx (Críticas), pages/PlaceholderPage.tsx (sin vista previa)}; router.tsx
```
