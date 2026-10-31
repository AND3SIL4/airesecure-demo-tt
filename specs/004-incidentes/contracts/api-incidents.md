# Contrato de la API: 004-incidentes

Convenciones del doc 08 §1. Las escrituras requieren `X-Actor-Id`.

## GET /api/incidents
Query:
- `status`: lista separada por comas, o `en_curso` (= `abierto,en_atencion,escalado`). Por defecto, todos.
- `severity`, `zone`, `type`: listas separadas por comas, aplicadas sobre la alerta.
- `q`: id del incidente, id de la alerta o descripción.
- `from` y `to`: ISO 8601 sobre `openedAt`.
- `sort`: `openedAt:desc` (por defecto) | `openedAt:asc` | `severity:desc|asc` | `responseSeconds:desc|asc` (los nulos al final).
- `page` y `pageSize` (1..100, por defecto 20).

Los valores inválidos se ignoran.

`200 { items: [Incident], total, page, pageSize }` con `Incident` según el doc 08 §2 (sin `timeline`):
```json
{ "id": "INC-0560", "status": "en_atencion",
  "alert": { AlertSummary },
  "team": { "id": "seg-t1", "name": "Seguridad T1" } | null,
  "escalatedTo": { "id": "policia", "name": "Policía aeroportuaria" } | null,
  "openedBy": { "id": "op-01", "alias": "Operador 01" },
  "openedAt": "…", "startedAt": "…" | null, "escalatedAt": null, "resolvedAt": null,
  "resolutionNote": null, "responseSeconds": 180, "resolutionSeconds": null }
```

## GET /api/incidents/{id}
`200 Incident` + `timeline: [TimelineEvent]` (combinada con la de la alerta y en orden ascendente). Si no existe: `404` "El incidente INC-9999 no existe.".

## POST /api/incidents/{id}/actions
| Body | Reglas |
|---|---|
| `{ "action": "assign", "teamId": "seg-t1", "comment"?: "…≤500" }` | Equipo existente; estado no final |
| `{ "action": "start" }` | Requiere equipo (422 `EQUIPO_REQUERIDO`) |
| `{ "action": "escalate", "teamId": "eod", "reason": "…≥10" }` | Equipo `specialized` (422 `VALIDACION` en `teamId` si no lo es) |
| `{ "action": "resolve", "note": "…≥10" }` | |
| `{ "action": "comment", "comment": "…3..500" }` | |

`200 Incident` con su timeline. Errores: 401, 404, 409 `TRANSICION_INVALIDA` (con `details {currentStatus, lastActor, lastActionAt}`) y 422.

Evento SSE tras el commit: `incident.updated { id, status, actorId }`.
