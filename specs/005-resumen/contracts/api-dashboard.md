# Contrato: GET /api/dashboard/summary

Sin `X-Actor-Id` (lectura). Fechas en UTC; horas agrupadas en hora de Bogotá.

```json
200 {
  "generatedAt": "2026-10-31T15:00:00Z",
  "kpis": {
    "activeAlerts": 12, "criticalAlerts": 2, "openIncidents": 3,
    "resolvedToday": 6, "avgResponseSecondsToday": 186
  },
  "deltas": {
    "activeAlerts":   { "value": 21, "previous": 17, "kind": "pct", "pct": 23.5 },
    "criticalAlerts": { "value": 3,  "previous": 0,  "kind": "abs", "diff": 3 },
    "openIncidents":  { "value": 9,  "previous": 7,  "kind": "pct", "pct": 28.6 },
    "resolvedToday":  { "value": 6,  "previous": 5,  "kind": "pct", "pct": 20.0 },
    "avgResponseSecondsToday": { "value": 186, "previous": null, "kind": "none" }
  },
  "topAlerts": [AlertSummary × ≤6],
  "zones": [{ "id": "T1-EQUIPAJES", "name": "Sala de equipajes", "riskLevel": "critica", "activeAlerts": 1 }],
  "activeAlertMarkers": [{ "id": "ALT-2240", "zoneId": "T1-EQUIPAJES", "severity": "critica" }],
  "byCategory7d": [{ "typeCode": "concentracion_personas", "typeName": "Concentración inusual de personas", "count": 9 }],
  "trend24h": [{ "hour": "2026-10-31T09:00:00-05:00", "count": 2 } × 24],
  "anomalies": [{ "scope": "zone", "key": "T1-EMBARQUE-A", "label": "Aumento inusual · Sala de embarque A",
                  "lastHour": 5, "hourlyMean": 1.0, "variationPct": 400.0 }]
}
```

- **Variación:** `delta.value` es el valor de hoy en la ventana comparable y `previous` el de ayer (de 00:00 a la misma hora). Para `activeAlerts` y `criticalAlerts`, la ventana compara las alertas *detectadas* (totales y críticas), porque las activas son una foto del momento; `kpis` lleva el valor actual.
- **`hourlyMean`:** es `max(media_7d, 1.0)` (mínimo de referencia).
- **`activeAlertMarkers`:** alimenta los marcadores del mini-mapa.
