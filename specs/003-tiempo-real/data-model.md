# Data Model: 003-tiempo-real

No hay tablas nuevas.

## Cambios en datos persistidos
- `app_settings`: nueva clave `stats.below_threshold` (entero, por defecto 0, creada por la siembra si no existe; nunca se sobrescribe).
- `alerts.origin`: ahora se usan también `simulador` y `escenario` (el enum ya existía).
- `timeline_events.action`: ahora se usa también `scenario_triggered` (actor = supervisor; payload `{scenarioId}`), registrado junto al `created` de la alerta del escenario.

## Estructuras de dominio (sin persistencia)
- `domain/simulation.py`:
  - `ZONE_COMPATIBILITY: dict[type_code, frozenset[zone_id]]` (research R5).
  - `CONFIDENCE_RANGE = (0.50, 0.98)` y `INTERVAL_JITTER = (0.75, 1.5)`.
  - `SimulatedEvent(type_code, zone_id, source_id, confidence, severity)`.
  - `draw_event(rng, alert_types, zones, sources) -> SimulatedEvent`, que excluye los tipos con `scenario_weight = 0` y aplica `elevate_severity` en zonas restringidas.
- `domain/scenarios.py`:
  - `Scenario(id, name, type_code, base_severity, zone_id, source_id, confidence)`.
  - `SCENARIOS` con E-1 a E-4 (doc 10 §8). La severidad final se calcula con `elevate_severity`, así que E-2 queda crítica.

## Eventos en vivo (no persistidos)
| Evento | Datos (camelCase) |
|---|---|
| `alert.created` | `AlertSummary` + `actorId` (null = Sistema) |
| `alert.updated` | `{ id, status, actorId }` |
| `incident.created` | `{ id, alertId, actorId }` |
| `heartbeat` | `{ ts }` |
