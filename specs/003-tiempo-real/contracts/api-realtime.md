# Contrato: 003-tiempo-real

## GET /api/stream
- `text/event-stream`, sin `X-Actor-Id` (EventSource no admite cabeceras; los datos no son sensibles en la demo).
- Primer mensaje: `retry: 3000`.
- Formato de cada mensaje: `event: <nombre>\ndata: <json>\n\n`.
- `heartbeat {ts}` cada 15 s sin otros eventos.

| event | data |
|---|---|
| `alert.created` | `AlertSummary` (doc 08 §2) + `"actorId": "op-01" \| null` |
| `alert.updated` | `{ "id": "ALT-2018", "status": "confirmada", "actorId": "op-01" }` |
| `incident.created` | `{ "id": "INC-0401", "alertId": "ALT-2018", "actorId": "op-01" }` |
| `heartbeat` | `{ "ts": "2026-10-30T21:00:00Z" }` |

Emisores: `POST /alerts` (created), `POST /alerts/{id}/actions` (updated y, en confirm, incident.created), el simulador (created) y los escenarios (created).

## GET /api/health (cambio)
```json
{ "status": "ok", "db": "ok", "version": "0.1.0",
  "simulator": { "enabled": true, "intervalSeconds": 60, "running": true, "belowThreshold": 3 } }
```

## GET /api/demo/scenarios (supervisor)
`200 [{ "id": "E-1", "name": "Equipaje abandonado en la sala de equipajes", "typeCode": "equipaje_abandonado", "severity": "critica", "zoneId": "T1-EQUIPAJES", "sourceId": "CAM-T1-012", "confidence": 0.94 }]`

`severity` es la final, ya elevada si la zona es restringida. Errores: 401 sin actor y 403 `SOLO_SUPERVISOR`.

## POST /api/demo/scenarios/{id}/trigger (supervisor)
`201 AlertDetail` (`origin: "escenario"`; timeline: `created` (Sistema) y `scenario_triggered` (supervisor)).

Errores: 401, 403 y 404 `NO_ENCONTRADO` "El escenario no existe.".
