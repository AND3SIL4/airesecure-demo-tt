# Contrato: configuración y demo (008)

Todas las rutas son **solo para supervisor**: `X-Actor-Id`; un operador recibe 403 `SOLO_SUPERVISOR`.

## GET /api/settings
```json
{ "simulator": { "enabled": true, "intervalSeconds": 60, "running": true, "nextRunAt": "2026-10-31T15:01:20Z" },
  "thresholds": { "equipaje_abandonado": 0.8, "objeto_inusual": 0.75, "acceso_restringido": 0.7,
                  "comportamiento_anomalo": 0.65, "concentracion_personas": 0.6, "permanencia_inusual": 0.6 },
  "belowThreshold": 12 }
```

## PUT /api/settings
Cuerpo parcial: `{ "simulator"?: { "enabled"?: bool, "intervalSeconds"?: int }, "thresholds"?: { code: number } }`.
- `200` con el estado completo (igual que GET).
- `422 VALIDACION` con `details.fields`: `simulator.intervalSeconds` fuera de 15..300, `thresholds.<code>` fuera de 0.50..0.99 o un tipo inexistente o sin umbral.
- Efectos: el evento `settings_updated` en la timeline (payload con los cambios) y el SSE `settings.updated` con el estado completo.

## POST /api/demo/reset
`200 { "alerts": 247, "incidents": 159, "resetAt": "…" }`.
- Efectos: los datos se regeneran relativos a "ahora"; se conserva el simulador (encendido e intervalo); los umbrales vuelven a sus valores por defecto; se registra el evento `demo_reset` y se envía el SSE `demo.reset { resetAt, actorId }`.

## SSE `alert.created` (cambio)
Se añade `triggeredBy: string | null`, que es el id del supervisor que disparó el escenario, o null. `actorId` sigue siendo null (Sistema).
