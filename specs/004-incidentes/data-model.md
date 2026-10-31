# Data Model: 004-incidentes

No hay tablas nuevas: `incidents` y `timeline_events` ya existen desde la feature 002 (ver `specs/002-alertas/data-model.md`).

## Uso de campos de `incidents`
| Campo | Cuándo se escribe |
|---|---|
| `team_id` | assign (último equipo asignado); en escalate se sustituye por el especializado |
| `escalated_to_id`, `escalated_at` | escalate |
| `started_at` | start (la primera vez que pasa a en_atencion; si se retoma tras escalar, se conserva la primera) |
| `resolved_at`, `resolution_note`, `resolution_seconds` | resolve |
| `response_seconds` | **al crear** (confirm): `alert.first_action_at − alert.detected_at` |

## Eventos de historia (incidente)
| action | from → to | comment | payload |
|---|---|---|---|
| assign | — | comentario opcional | `{teamId, teamName, previousTeamId}` |
| start | abierto/escalado → en_atencion | — | — |
| escalate | abierto/en_atencion → escalado | motivo | `{teamId, teamName}` |
| resolve | en_atencion/escalado → resuelto | nota de cierre | `{resolutionSeconds}` |
| comment | — | texto | — |

Todos con `incident_id` y `alert_id` nulo, salvo `incident_created`, que tiene ambos.

## Reglas
- Ver research R1 para las transiciones y validaciones; mensajes:
  - "Asigna un equipo antes de iniciar la atención."
  - "Solo se puede escalar a un equipo especializado."
  - "El motivo debe tener al menos 10 caracteres."
  - "La nota de cierre debe tener al menos 10 caracteres."
  - 409: "El incidente INC-xxxx ya fue {estado} por {alias} a las {HH:MM}."
- Severidad, zona y tipo del incidente: los de su alerta.

## Semilla (resumen; detalle en el doc 10 §3-§4 y en research R6)
| Bloque | Cantidad |
|---|---|
| Histórico de 30 días | ≈ 220 alertas: ≈ 150 confirmadas con incidente resuelto (≈ 10 % escalados) y ≈ 70 descartadas |
| Hoy | 6 incidentes resueltos + 3 en curso (abierto sin equipo, hace 20 min; en atención con seg-t1, hace 35 min; escalado a policia, hace 50 min) + lo existente de la feature 002 (12 activas, 3 descartadas, 3 de la anomalía) |
| IDs | En orden cronológico global: ALT-2001… e INC-0401… |
