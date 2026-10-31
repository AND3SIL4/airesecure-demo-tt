# Quickstart y validación manual: 008-configuracion-demo

| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | `GET /api/settings` como `op-01` y como `sup-a` | 403 / 200 con simulador, umbrales y belowThreshold | FR-001, SC-004 |
| 2 | `PUT /api/settings {simulator:{intervalSeconds:10}}` | 422 con el campo `simulator.intervalSeconds` | US1-4 |
| 3 | `PUT {simulator:{enabled:false}}` y esperar 1 min | Sin alertas nuevas; `running:false` y `nextRunAt:null` | US1-3, SC-002 |
| 4 | `PUT {thresholds:{equipaje_abandonado:0.99}}` | 200; `/api/alert-types` refleja 0.99; timeline `settings_updated` | US3 |
| 5 | `POST /api/demo/reset` (sup-a) con un stream SSE abierto | 200 con conteos (≈ 247 / 159); llega `demo.reset`; los datos se regeneran; el simulador conserva su estado | US1-2/5, SC-001 |
| 6 | UI /configuracion como sup-a | 4 tarjetas: Simulador, Escenarios, Umbrales y Zona de peligro | FR-005 |
| 7 | Reiniciar demo: el botón solo se activa al escribir `REINICIAR` | Las pestañas abiertas vuelven al Resumen | US1-1/2 |
| 8 | Disparar E-1 desde la UI con otra pestaña de op-01 | sup-a: toast "Escenario E-1 disparado: ALT-xxxx" sin "Nueva alerta"; op-01: aviso crítico | US2, SC-003 |
| 9 | Encender o apagar el simulador y cambiar el intervalo desde la UI | El estado y la cuenta regresiva se actualizan; otra pestaña de Configuración se sincroniza | US1-3/4, US3-3 |
| 10 | Linters y build | Sin errores | FR-006 |
