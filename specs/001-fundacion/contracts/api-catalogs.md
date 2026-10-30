# Contrato de la API: 001-fundacion

Base: `http://localhost:8000/api`. JSON en camelCase. Convenciones y formato de error según `docs/arquitectura-y-diseño/08-especificacion-api.md` §1. Todos los endpoints de esta feature son `GET` y no requieren `X-Actor-Id`, **salvo `/me`**.

## GET /health
```json
200 { "status": "ok", "db": "ok", "version": "0.1.0", "simulator": { "enabled": true, "intervalSeconds": 60, "running": false } }
```
`simulator.running` es `false` hasta la feature 003.

## GET /users
```json
200 [ { "id": "op-01", "alias": "Operador 01", "role": "operador" }, { "id": "op-02", "alias": "Operador 02", "role": "operador" }, { "id": "sup-a", "alias": "Supervisor A", "role": "supervisor" } ]
```

## GET /me  *(añadido; documentado en el doc 08 §3.1)*
Cabecera `X-Actor-Id` obligatoria.
```json
200 { "id": "op-01", "alias": "Operador 01", "role": "operador" }
401 { "error": { "code": "ACTOR_REQUERIDO", "message": "Selecciona un perfil para continuar.", "details": {} } }
```

## GET /zones
```json
200 [ {
  "id": "T1-EQUIPAJES", "name": "Sala de equipajes", "terminal": "T1",
  "criticality": 3, "restricted": false,
  "geometry": { "x": -52, "z": -5, "w": 16, "d": 30, "h": 4 },
  "riskLevel": "normal", "activeAlerts": 0
} ]
```
`riskLevel` = la severidad máxima de las alertas activas de la zona, o `normal` si no hay. En 001 siempre es `normal` / `0`.

## GET /teams
```json
200 [ { "id": "eod", "name": "Unidad antiexplosivos (EOD)", "specialty": "Explosivos", "specialized": true } ]
```

## GET /alert-types
```json
200 [ {
  "code": "equipaje_abandonado", "name": "Equipaje abandonado",
  "defaultSeverity": "critica", "confidenceThreshold": 0.80, "scenarioWeight": 1,
  "recommendation": "Verificar visualmente…", "protocol": ["Verificar con las cámaras cercanas", "…"]
} ]
```
`defaultSeverity` y `confidenceThreshold` son `null` en `reporte_operador`. El umbral efectivo se lee de `app_settings` (`thresholds.<code>`).

## GET /dismiss-reasons
```json
200 [ { "code": "pertenencia_personal", "label": "Objeto identificado como pertenencia del personal" }, …, { "code": "otro", "label": "Otro", "requiresText": true } ]
```

## Errores comunes (todas las rutas)
| Caso | Respuesta |
|---|---|
| Ruta inexistente | `404 { error: { code: "NO_ENCONTRADO", … } }` |
| Validación de query o body | `422 { error: { code: "VALIDACION", details: { fields: [{ field, message }] } } }` |
| Excepción no controlada | `500 { error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado." } }` |
| `require_supervisor` con un operador | `403 { error: { code: "SOLO_SUPERVISOR", … } }` (primer uso real en las features 007 y 008) |
