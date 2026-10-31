# Quickstart y validación manual: 005-resumen

> Base nueva (borra `backend/data/aerosecure.db`) y simulador desactivado tras el primer arranque, para tener valores estables.

| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | `GET /api/dashboard/summary` | kpis: 12 activas, 2 críticas, 3 en curso, 6 resueltas hoy; `avgResponseSecondsToday` > 0 | FR-001 |
| 2 | Comparar con `/api/alerts?status=activas`, `…&severity=critica` y `/api/incidents?status=en_curso` | Mismos totales | SC-003 |
| 3 | `deltas` | Cada uno con `kind` pct, abs o none, coherente con su `previous` | FR-002 |
| 4 | `topAlerts` | 6, iguales y en el mismo orden que la primera página de `/api/alerts` | US2-1 |
| 5 | `anomalies` | Incluye T1-EMBARQUE-A (zona) y `concentracion_personas` (tipo) con `lastHour` ≥ 5 | SC-004 |
| 6 | `trend24h` | 24 elementos consecutivos | US3-4 |
| 7 | UI "/" | Los 5 KPI con variación y texto; alertas prioritarias; mini-mapa con colores, marcadores y leyenda; dona, línea y anomalías con la etiqueta "Detección basada en reglas · demostrativa"; sin la vista previa de componentes | US1-US3 |
| 8 | Clic en una zona del mini-mapa | /alertas filtrada por esa zona | US2-2 |
| 9 | Topbar "Críticas (2)" → clic | /alertas?status=activas&severity=critica con 2 resultados | US2-3 |
| 10 | Disparar E-1 (sup-a) con el Resumen abierto | KPIs, top y "Críticas (3)" se actualizan en ≤ 2 s | SC-005 |
| 11 | Linters y build | Sin errores | FR-010 |
