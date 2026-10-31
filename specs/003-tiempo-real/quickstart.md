# Quickstart y validación manual: 003-tiempo-real

> Sin pruebas automatizadas. Arranque con `./start-demo.ps1` (o con uvicorn + `bun run dev`). Para que las alertas lleguen rápido durante la verificación, con el backend arrancado al menos una vez ejecuta en `backend/`:
> `uv run python -c "import sqlite3; c=sqlite3.connect('data/aerosecure.db'); c.execute(\"UPDATE app_settings SET value_json='15' WHERE key='simulator.interval_seconds'\"); c.commit()"`
> El simulador lee la configuración en cada ciclo, así que no hace falta reiniciar. La UI de configuración llega en la feature 008.

| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | `curl -N http://localhost:8000/api/stream` | Recibe `retry: 3000` y, cada 15 s, un `heartbeat` | FR-001 |
| 2 | Con el stream abierto, `POST /api/alerts/{id}/actions {review}` | Llega `alert.updated` con el `actorId` | FR-002 |
| 3 | `confirm` sobre una alerta | Llegan `alert.updated` e `incident.created` | FR-002 |
| 4 | `GET /api/health` | `simulator.running: true` y `belowThreshold` ≥ 0 | FR-007 |
| 5 | Esperar 2-3 ciclos del simulador | Llegan `alert.created` con `origin: simulador`; ninguna tiene confianza bajo el umbral de su tipo; `belowThreshold` sube cuando hay descartes | FR-004-006, SC-003 |
| 6 | Revisar las zonas de las alertas simuladas | Acceso restringido solo en Servicio o Plataforma; zona restringida → severidad elevada | FR-005 |
| 7 | `GET /api/demo/scenarios` como `sup-a` | Los 4 escenarios; E-2 `critica` | FR-009 |
| 8 | Mismo endpoint como `op-01` | 403 `SOLO_SUPERVISOR` | FR-009 |
| 9 | `POST /api/demo/scenarios/E-1/trigger` (sup-a) | 201; alerta crítica con confianza 0,94 en Sala de equipajes; timeline `created` + `scenario_triggered` | FR-009, SC-002 |
| 10 | `POST /api/demo/scenarios/E-9/trigger` | 404 "El escenario no existe." | FR-009 |
| 11 | UI con dos pestañas (op-01 en Alertas y op-02 en el detalle de otra) + disparar E-1 | Toast persistente "Nueva alerta…" con "Ver alerta" en ambas, contador del menú +1, fila resaltada y campana con 1 no leída, en ≤ 2 s | US1, SC-001 |
| 12 | Pulsar "Ver alerta" | Navega al detalle sin recargar | US1-2 |
| 13 | Confirmar una alerta en la pestaña 1 con su detalle abierto en la 2 | La pestaña 2 se actualiza sola y muestra un toast info "…por otro usuario"; la pestaña 1 no ve un aviso duplicado | US1-4, SC-006 |
| 14 | Con el foco en la tabla de Alertas + disparar E-3 | Aparece la píldora "1 alerta nueva · Mostrar"; la tabla no salta | FR-015 |
| 15 | Detener el backend con la UI abierta | Tras 3 s: "Reconectando…" y el banner; al reanudar, "En vivo" y los datos se refrescan | US4, SC-004 |
| 16 | Apagar el backend (Ctrl+C) | Se cierra sin errores del simulador | FR-008 |
| 17 | Linters: ruff, eslint, `tsc --noEmit` y build | Sin errores | FR-016 |

Checklist del doc 11 §3 que aplica: HU-05, HU-27 y "Dos pestañas: confirmar en una actualiza la otra".
