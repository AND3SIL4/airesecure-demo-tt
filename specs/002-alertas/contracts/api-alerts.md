# Contrato de la API: 002-alertas

Convenciones del doc 08 §1. DTOs del doc 08 §2. Las escrituras requieren `X-Actor-Id`.

## GET /api/alerts
Query:
- `status`: lista separada por comas, o `activas` (= `nueva,en_revision`). **Por defecto `activas`.**
- `severity`, `zone`, `type`, `source`: listas separadas por comas.
- `q`: texto sobre el id y la descripción, sin distinguir mayúsculas.
- `from`, `to`: ISO 8601 sobre `detectedAt`.
- `sort`: `score:desc` (por defecto) | `score:asc` | `detectedAt:desc` | `detectedAt:asc` | `severity:desc` | `severity:asc`.
- `page` (≥ 1, por defecto 1) y `pageSize` (1..100, por defecto 20).

Los valores de filtro desconocidos se ignoran.

```json
200 { "items": [AlertSummary], "total": 12, "page": 1, "pageSize": 20 }
```

`AlertSummary`:
```json
{ "id": "ALT-2003", "type": { "code": "equipaje_abandonado", "name": "Equipaje abandonado" },
  "severity": "critica", "status": "nueva",
  "zone": { "id": "T1-EQUIPAJES", "name": "Sala de equipajes" },
  "source": { "id": "CAM-T1-012", "kind": "camara", "label": "Cámara CAM-T1-012" },
  "detectedAt": "2026-10-30T20:39:00Z", "confidence": 0.94, "score": 94,
  "description": "Posible equipaje sin supervisión…", "incidentId": null }
```

## GET /api/alerts/{id}
`200 AlertDetail` = `AlertSummary` más:
```json
{ "scoreBreakdown": { "severityWeight": 1.0, "confidence": 0.94, "zoneFactor": 1.0, "zoneCriticality": 3, "score": 94, "manual": false },
  "recommendation": "…", "protocol": ["…"],
  "evidenceUrl": "/evidence/equipaje_abandonado.svg", "evidenceIsIllustrative": true,
  "origin": "seed",
  "dismissReason": null, "dismissReasonLabel": null, "dismissComment": null,
  "reviewedBy": { "id": "op-01", "alias": "Operador 01" } | null,
  "reportedBy": null, "firstActionAt": null, "closedAt": null,
  "timeline": [TimelineEvent] }
```
`TimelineEvent`: `{ id, action, actor: {id, alias} | null, fromStatus, toStatus, comment, payload, createdAt }`, en orden ascendente.

Si no existe: `404 NO_ENCONTRADO` "La alerta ALT-9999 no existe.".

## POST /api/alerts (reporte manual)
Body: `{ "typeCode": "reporte_operador", "zoneId": "T1-CHECKIN", "severity": "media", "description": "…(10..500)" }`

`201 AlertDetail` (`origin = manual`, `source = MANUAL`, `confidence = null`, `reportedBy = actor`, estado `nueva`).

Errores: 401 sin actor; 422 `VALIDACION` (campos, tipo o zona inexistentes) con `details.fields`.

## POST /api/alerts/{id}/actions
| Body | Respuesta |
|---|---|
| `{ "action": "review" }` | `200 AlertDetail` |
| `{ "action": "confirm", "note": "…≤500" }` | `201 { "alert": AlertDetail, "incident": { "id": "INC-0401", "status": "abierto", "alertId": "ALT-…", "openedAt": "…" } }` |
| `{ "action": "dismiss", "reason": "movimiento_normal", "comment": "…" }` (`comment` ≥ 10 si `reason = otro`) | `200 AlertDetail` |
| `{ "action": "comment", "comment": "…3..500" }` | `200 AlertDetail` |

Errores:
- `409 TRANSICION_INVALIDA`: "La alerta ALT-2003 ya fue confirmada por Operador 02 a las 15:44." con `details: { currentStatus, lastActor: {id, alias} | null, lastActionAt }`. Si la acción es `review` sobre una alerta que ya no está nueva: "La alerta ALT-2003 ya está en revisión." (el front lo ignora).
- `422 VALIDACION`: acción desconocida, motivo faltante o texto corto (mensajes en español).
- `404 NO_ENCONTRADO`.

## GET /api/sources (nuevo catálogo)
`200 [{ "id": "CAM-T1-012", "kind": "camara", "label": "Cámara CAM-T1-012", "zoneId": "T1-EQUIPAJES" }]`. Ordenado por id. Documentado en el doc 08 §3.1.

## GET /api/zones (cambio)
`riskLevel` y `activeAlerts` se calculan con las alertas activas (`nueva` y `en_revision`).

## Mensajes 422 (todas las rutas)
`details.fields[].message` en español (research R6).
