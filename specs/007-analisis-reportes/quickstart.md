# Quickstart y validación manual: 007-analisis-reportes

> Base nueva; simulador desactivado.

| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | `GET /api/analytics/by-zone?days=30` y `by-type` | Las sumas coinciden con `GET /api/incidents?from=<hoy−30d>` (total) | SC-002 |
| 2 | `trend?days=7` | 7 días consecutivos; total = suma de las severidades | FR-001 |
| 3 | `times?days=30` | Medias de respuesta de 1-8 min y de resolución de 15-180 min | FR-001 |
| 4 | `outcomes?days=30` | Tasa ≈ 0,68; `belowThreshold` ≥ 0 | FR-001 |
| 5 | `GET /api/reports/incidents.csv` como `op-01` | 403 | SC-004 |
| 6 | Mismo endpoint como `sup-a` con `severity=critica` | CSV con BOM, cabeceras en español y filas = total filtrado; se abre en Excel con tildes | SC-003 |
| 7 | UI /analisis: cambiar 7, 14 y 30 días | 6 bloques recalculados; `?days=` en la URL; títulos-pregunta; anomalías etiquetadas | US1 |
| 8 | UI /reportes (supervisor): filtrar, vista previa y descargar | Vista previa de 10 filas y el total; el archivo se descarga | US2 |
| 9 | UI /incidentes como supervisor y como operador | El botón "Exportar CSV" solo aparece para el supervisor | US2-3/4 |
| 10 | Linters y build | Sin errores | — |
