# Research: 003-tiempo-real

## R1. Puerto de publicación e inyección
- **Decision**: `backend/app/services/ports.py` define `class EventPublisher(Protocol): def publish(self, event: str, data: dict) -> None`, más `NullPublisher` (no hace nada). `AlertService(session, publisher: EventPublisher = NullPublisher())`. En `api/deps.py`, `get_publisher(request)` devuelve `request.app.state.event_bus` (`PublisherDep`). El simulador y los escenarios usan el mismo bus.
- **Rationale**: es el doc 06 §2.1 (puertos en services e implementación en infrastructure). Además, `services` sigue sin conocer FastAPI ni asyncio.

## R2. Bus en memoria seguro entre hilos
- **Decision**: `infrastructure/event_bus.py::EventBus`:
  - Guarda el event loop principal (`bind_loop(loop)` en el lifespan) y un `set[asyncio.Queue]` de suscriptores.
  - `publish()` puede llamarse desde los endpoints síncronos de FastAPI, que corren en el threadpool, y desde el simulador. Usa `loop.call_soon_threadsafe(self._fanout, event, data)`.
  - `_fanout` hace `put_nowait` en cada cola (`maxsize=100`); si una cola está llena, descarta su evento más antiguo.
  - `subscribe()` y `unsubscribe(q)`.
- **Rationale**: `asyncio.Queue` no es *thread-safe*; los routers síncronos de las features 001 y 002 corren en otro hilo.
- **Alternatives considered**: convertir los routers en async (cambio grande); Redis pub/sub (dependencia y coste).

## R3. Publicar después del commit
- **Decision**: los servicios acumulan los eventos en una lista durante la transacción y los publican al final, tras un commit exitoso.
  - `apply_action` → `alert.updated {id, status, actorId}` y, en confirm, además `incident.created {id, alertId, actorId}`.
  - `report_manual` y `create_from_event` → `alert.created` con `AlertSummary` + `actorId`.
- **Rationale**: es FR-002; nunca se notifica un cambio revertido.

## R4. Endpoint SSE
- **Decision**: `api/routers/stream.py` con `GET /stream` (async), que devuelve `StreamingResponse(media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})`.
  - El generador se suscribe y espera `asyncio.wait_for(queue.get(), 15)`; si vence el tiempo, emite `heartbeat {ts}`.
  - Formato: `event: <name>\ndata: <json camelCase>\n\n`. Primer mensaje: `retry: 3000`.
  - En el `finally` se ejecuta `unsubscribe`, y se comprueba `request.is_disconnected()` en cada ciclo.
  - No requiere `X-Actor-Id`: `EventSource` no permite cabeceras y los datos no son sensibles en la demo. Se documenta en el doc 08.
- **Rationale**: no añade dependencias (Starlette); el proxy de Vite transmite SSE sin búfer.

## R5. Simulador
- **Decision**: `infrastructure/simulator.py::Simulator` con `start()` y `stop()` (cancela la tarea) y la propiedad `running`. El bucle `async`:
  1. Lee la configuración en un hilo (`asyncio.to_thread`) con una sesión propia.
  2. Si está desactivado, duerme 5 s y vuelve a comprobar.
  3. Espera `uniform(0.75, 1.5) × interval`.
  4. Ejecuta `asyncio.to_thread(self._tick)`.

  `_tick` abre una `Session` y llama a `AlertService(session, bus).simulate_event(rng)`. La lógica pura de elección (tipo por peso, zona compatible, fuente, confianza y severidad) va en `domain/simulation.py::draw_event(rng, types, zones, sources)`; las reglas de compatibilidad de zona, en `domain/simulation.py` (`ZONE_COMPATIBILITY`).
- **Rationale**: las reglas quedan en el dominio y son reutilizables. Las operaciones de base de datos sincrónicas no bloquean el event loop. La configuración se lee en cada ciclo, así que los cambios aplican en caliente.
- `ZONE_COMPATIBILITY` (doc 10 §7, completado):
  - `acceso_restringido`: {SERVICIO, PLATAFORMA}.
  - `equipaje_abandonado`: {EQUIPAJES, HALL, CHECKIN, EMBARQUE-A}.
  - `objeto_inusual`: todas salvo PLATAFORMA.
  - `concentracion_personas`: {HALL, CHECKIN, SEGURIDAD, MIGRACION, EMBARQUE-A, PUERTAS}.
  - `comportamiento_anomalo` y `permanencia_inusual`: todas las no restringidas.

  Se documentan en el doc 10 §7.

## R6. Contador bajo umbral
- **Decision**: la clave `stats.below_threshold` en `app_settings` (entero; se crea en 0 si no existe), incrementada por `SettingsRepository.increment(key)` en la misma transacción del tick. Se expone en `/api/health` (`simulator.belowThreshold`) para la verificación.
- **Rationale**: es persistente y ya está listo para que lo use `/analytics/outcomes` (007).

## R7. Escenarios
- **Decision**: `domain/scenarios.py` contiene `SCENARIOS` (las 4 definiciones del doc 10 §8, inmutables). `services/scenario_service.py::ScenarioService(session, publisher)` tiene `list()` y `trigger(id, actor)`: crea la alerta vía `AlertService.create_from_event(..., origin=escenario, ignore_threshold=True)` y registra `scenario_triggered` (actor = supervisor) en la misma transacción. Un id inexistente → `DomainError(NO_ENCONTRADO, "El escenario no existe.")`.
- **Router**: `api/routers/demo.py` con `GET /demo/scenarios` y `POST /demo/scenarios/{id}/trigger`, ambos con `SupervisorDep`. Responde `201 AlertDetail`.

## R8. Suscriptor del frontend
- **Decision**:
  - `infrastructure/sse.ts`: `connectLiveEvents(handlers)` envuelve `EventSource('/api/stream')`, informa del estado (`connecting`, `open`, `reconnecting`) y devuelve `close()`. El navegador reconecta solo.
  - `application/useLiveEvents.ts` se monta una vez en `Shell`. Mapea cada evento a `queryClient.invalidateQueries` (`alerts`, `catalog.zones`, `alerts.detail(id)`, `incidents` y `dashboard` cuando existan) y a los avisos. Al reconectar, tras haber estado en `reconnecting`, ejecuta `invalidateQueries()` general.
  - Se ignoran los eventos cuyo `actorId` sea el del perfil activo, solo para los avisos (los datos sí se invalidan).
  - Stores: `stores/liveStatus.ts` (estado de la conexión, con un temporizador de 3 s para pasar a `reconnecting`) y `stores/notifications.ts` (las últimas 10, `unread` y `markAllRead`).
  - Toasts: los críticos `persistent: true` con `action {label: 'Ver alerta', to}`, y el resto con un máximo de 3 visibles (el store de toasts descarta los más antiguos no persistentes).
- **Rationale**: un único punto de entrada; las capas se respetan.

## R9. Contador de pendientes del menú
- **Decision**: `useAlertCounts()` llama a `GET /api/alerts?status=activas&pageSize=1` y usa `total` (clave `alerts.counts`, invalidada por los eventos). Se muestra en `Sidebar` como un badge con `aria-label="N alertas pendientes"` (en la versión colapsada, un punto con el número).
- **Rationale**: reutiliza el endpoint existente; no hace falta otro.

## R10. Lista en vivo sin perder el foco
- **Decision**: `AlertsPage` detecta el foco dentro de la tabla (`focusin` y `focusout`). Mientras hay foco, congela los datos mostrados (`frozenPage`) y cuenta los `alert.created` que llegan (vía el store de notificaciones). Muestra la píldora "N alertas nuevas · Mostrar"; al pulsarla, descongela y resalta las nuevas. Sin foco, la lista se actualiza sola y resalta los ids recién llegados durante 2 s (`motion-safe`).
