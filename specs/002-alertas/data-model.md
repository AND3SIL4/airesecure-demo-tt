# Data Model: 002-alertas

Fuente: `docs/arquitectura-y-diseño/07-modelo-de-datos.md` y `docs/docs-generales/05-estados-y-reglas-de-dominio.md`. Las tablas se añaden a `backend/app/domain/models.py` y se crean con `create_all` (sobre una base existente se crean las que faltan). Las fechas usan `UtcDateTime` y los enums `enum_text(...)`, como en la feature 001.

## Enums nuevos (domain/enums.py)
| Enum | Valores |
|---|---|
| `AlertStatus` | `nueva`, `en_revision`, `confirmada`, `descartada` |
| `IncidentStatus` | `abierto`, `en_atencion`, `escalado`, `resuelto` |
| `AlertOrigin` | `seed`, `simulador`, `escenario`, `manual` |
| `AlertAction` | `review`, `confirm`, `dismiss`, `comment` |
| `TimelineAction` | `created`, `review`, `confirm`, `dismiss`, `comment`, `incident_created`, `assign`, `start`, `escalate`, `resolve`, `demo_reset`, `scenario_triggered`, `settings_updated` |

## alerts
| Campo | Tipo | Reglas |
|---|---|---|
| id | str(12) PK | `ALT-2001…` |
| type_code | str(32) FK → alert_types.code | |
| zone_id | str(16) FK → zones.id | |
| source_id | str(16) FK → sources.id | |
| severity | Severity | |
| status | AlertStatus | por defecto `nueva` |
| origin | AlertOrigin | |
| detected_at | datetime UTC | |
| confidence | float nullable | 0.00..1.00; nula si `origin = manual` |
| score | int | 0..100 |
| score_breakdown_json | text | `{severityWeight, confidence, zoneFactor, zoneCriticality, score, manual}` |
| description | text | 10..500 |
| recommendation | text | copia de la recomendación del tipo al crear |
| evidence_key | str(64) | = `type_code` |
| dismiss_reason | str(32) nullable | DismissReason; solo si el estado es `descartada` |
| dismiss_comment | text nullable | obligatorio si `dismiss_reason = otro` (≥ 10) |
| reported_by | str(16) FK → users.id nullable | solo en las manuales |
| reviewed_by | str(16) FK → users.id nullable | actor de la revisión |
| first_action_at | datetime nullable | primera acción humana (review, confirm o dismiss) |
| closed_at | datetime nullable | al confirmar o descartar |

Índices: `(status, score)`, `(detected_at)`, `(zone_id)`, `(type_code)`.

> Desviación menor respecto al doc 07: se añade `dismiss_comment` para guardar el texto del motivo "Otro" sin mezclarlo con el código del motivo. Se documenta en el doc 07.

## incidents (en esta feature solo se crea)
| Campo | Tipo | Reglas |
|---|---|---|
| id | str(12) PK | `INC-0401…` |
| alert_id | str(12) FK → alerts.id **UNIQUE** | |
| status | IncidentStatus | `abierto` al crear |
| team_id | str(16) FK → teams.id nullable | |
| escalated_to_id | str(16) FK → teams.id nullable | |
| opened_by | str(16) FK → users.id | |
| opened_at | datetime | |
| started_at, escalated_at, resolved_at | datetime nullable | |
| resolution_note | text nullable | |
| response_seconds, resolution_seconds | int nullable | |

Índices: `(status)`, `(opened_at)`.

## timeline_events
| Campo | Tipo | Reglas |
|---|---|---|
| id | int PK autoincremental | |
| alert_id | str(12) FK nullable | |
| incident_id | str(12) FK nullable | al menos uno de los dos |
| actor_id | str(16) FK → users.id nullable | nulo = Sistema |
| action | TimelineAction | |
| from_status, to_status | str(16) nullable | |
| comment | text nullable | |
| payload_json | text nullable | p. ej. `{"incidentId": "INC-0401"}`, `{"reason": "movimiento_normal"}` |
| created_at | datetime | |

Índices: `(alert_id, created_at)`, `(incident_id, created_at)`. Solo inserción.

## Reglas de dominio (doc 05)
- Transiciones: `review` desde {nueva}; `confirm` y `dismiss` desde {nueva, en_revision}; `comment` desde cualquier estado.
- Revisión implícita: si el estado es `nueva` y la acción es `confirm` o `dismiss`, primero se registra `review` del mismo actor.
- `confirm` → crea el incidente (abierto) y los eventos `confirm` (alerta) e `incident_created` (alerta e incidente). `closed_at` = ahora.
- `first_action_at` se fija en la primera acción humana (excluye `comment`).
- Score: `round(100 × w_sev × confianza × f_zona)`, con `w_sev` {1.00, 0.75, 0.50, 0.25} y `f_zona` {1: 0.60, 2: 0.80, 3: 1.00}; en las manuales, confianza 1.0.
- Severidad de la zona (`riskLevel`): la de mayor orden entre sus alertas activas (nueva o en revisión); si no hay ninguna, `normal`.

## Datos semilla (infrastructure/seed/alerts.py)
- **Activas (12)**: las del doc 10 §4. Los minutos "hace" relativos a `now`; los estados y fuentes de esa tabla; la severidad de la #2 es `critica` (elevada por zona restringida). Las 4 en revisión (#2, #4, #7, #10) llevan revisor (`op-01` u `op-02`, alternando) y su evento `review` 1-3 min después de creadas. La #11 es manual (`MANUAL`, `reported_by = op-02`, `confidence = null`).
- **Descartadas hoy (3)**: `objeto_inusual` en T1-HALL hace 5 h (`pertenencia_personal`), `comportamiento_anomalo` en T1-CHECKIN hace 3 h (`movimiento_normal`) y `permanencia_inusual` en T1-COMERCIAL hace 2 h (`falla_camara`).
- **Anomalía (3)**: `concentracion_personas` en T1-EMBARQUE-A hace 25, 38 y 52 min, descartadas por `movimiento_normal`.
- Cada alerta lleva el evento `created`; las descartadas, además, `review` y `dismiss` con actor y comentario.
- Orden de inserción cronológico, para que los IDs crezcan con el tiempo.
