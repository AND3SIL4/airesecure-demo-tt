# Contrato: analítica y reportes (007)

Todas las rutas de analítica son de solo lectura y no requieren actor. Parámetro `days` = 7, 14 o 30 (cualquier otro valor → 30).

- **Ventanas**: los totales y las medias (`by-zone`, `by-type`, `times` global, `outcomes`) usan `opened_at`/`detected_at` ≥ ahora − `days`. Las series diarias (`trend`, `times.byDay`) usan días completos de Bogotá (desde las 00:00 de hoy − (days−1)), por lo que su suma puede ser ligeramente menor que los totales.
- Tiempos en segundos enteros; `confirmationRate` con 4 decimales.

| Ruta | Respuesta |
|---|---|
| `GET /api/analytics/by-zone?days=30` | `[{ zoneId, zoneName, count }]`, con las 10 zonas (incluidas las que tienen 0) y orden descendente por count |
| `GET /api/analytics/by-type?days=30` | `[{ typeCode, typeName, count }]` (solo los tipos con count > 0, en orden descendente) |
| `GET /api/analytics/trend?days=30` | `[{ date: "2026-10-02", total, critica, alta, media, baja }]`: `days` elementos consecutivos (fecha de Bogotá) |
| `GET /api/analytics/times?days=30` | `{ avgResponseSeconds: number\|null, avgResolutionSeconds: number\|null, byDay: [{ date, avgResponseSeconds, avgResolutionSeconds }] }` |
| `GET /api/analytics/outcomes?days=30` | `{ confirmed, dismissed, confirmationRate: number\|null (0..1), belowThreshold }` |
| `GET /api/analytics/anomalies` | `Anomaly[]` (el mismo formato y la misma regla que `dashboard.anomalies`) |

## GET /api/reports/incidents.csv (supervisor)
- Los mismos query params que `GET /api/incidents` (salvo `page` y `pageSize`), con un máximo de 5000 filas.
- `200 text/csv; charset=utf-8`, con BOM y `Content-Disposition: attachment; filename="incidentes-YYYYMMDD-HHMM.csv"` (hora de Bogotá).
- Cabeceras: `ID incidente,ID alerta,Tipo,Severidad,Zona,Estado,Equipo,Escalado a,Abierto,Inicio atención,Resuelto,T. respuesta (min),T. resolución (min),Nota de cierre`.
- Fechas en formato `YYYY-MM-DD HH:MM` (hora de Bogotá). Los minutos llevan 1 decimal con punto. Severidad y estado van con su etiqueta legible ("Crítica", "En atención").
- Errores: 401 si no hay actor y 403 `SOLO_SUPERVISOR`.
