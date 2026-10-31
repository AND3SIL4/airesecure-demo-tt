# Implementation Plan: Tiempo real, simulador y escenarios

**Branch**: `003-tiempo-real` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-tiempo-real/spec.md`

## Summary

Añadir el bus de eventos en memoria (seguro entre hilos), el endpoint SSE `/api/stream` con heartbeat, la publicación de eventos tras el commit en `AlertService`, el simulador asíncrono con reglas de dominio (tipo por peso, zona compatible, elevación por zona restringida, umbral y contador "bajo umbral") y los escenarios E-1 a E-4 (solo supervisor). En el frontend: suscriptor único con invalidación de datos, avisos (críticos persistentes con "Ver alerta"), indicador de conexión, contador de pendientes en el menú, campana con las notificaciones de la sesión y la lista en vivo sin perder el foco. Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.12 · TypeScript 5 / React 18.3

**Primary Dependencies**: las existentes; **ninguna nueva** (SSE con `StreamingResponse`; `EventSource` nativo)

**Storage**: SQLite; nueva clave `stats.below_threshold` en `app_settings`

**Testing**: ninguno; [quickstart.md](quickstart.md)

**Target Platform**: Windows 11 local; Chrome y Edge

**Project Type**: aplicación web

**Performance Goals**: un evento visible en ≤ 2 s (RNF-03); el heartbeat de 15 s mantiene viva la conexión

**Constraints**: endpoints síncronos en el threadpool → publicación con `call_soon_threadsafe`; un solo proceso uvicorn (sin `--workers`)

**Scale/Scope**: unos 3 clientes simultáneos; 1 evento por minuto aproximadamente

## Constitution Check

| Principio | Cumplimiento | Estado |
|---|---|---|
| I. Documentación | Se citan los docs 04, 05, 06, 08, 09 y 10. Se completan en los docs: la compatibilidad de zonas (doc 10 §7), `actorId` en los eventos y el stream sin cabecera (doc 08 §3.7), y `belowThreshold` en health | ✅ |
| II. Capas | Puerto `EventPublisher` en services; `EventBus` y `Simulator` en infrastructure (el simulador usa services, permitido); reglas de simulación y escenarios en domain; router SSE en api | ✅ |
| III. Humano en el bucle | El simulador solo crea alertas `nueva`; nada se confirma automáticamente; los escenarios registran al supervisor | ✅ |
| IV. Transparencia | Las alertas simuladas llevan `origin` simulador o escenario; el indicador "En vivo" es honesto | ✅ |
| V. Privacidad | Sin cambios | ✅ |
| VI. Accesibilidad | `aria-live` assertive para críticas y polite para el resto; badges con texto; campana accesible; `motion-safe`; píldora en lugar de reordenar con el foco | ✅ |
| VII. Simplicidad | Sin dependencias; bus en memoria | ✅ |
| VIII. Sin pruebas | ✅ | ✅ |
| IX. Un comando | El simulador arranca con el servidor | ✅ |
| X. Idioma | Avisos en español | ✅ |

**Re-check post-design**: ✅

## Project Structure

### Documentation (this feature)
```text
specs/003-tiempo-real/ plan.md research.md data-model.md quickstart.md contracts/{api-realtime.md, ui-realtime.md} checklists/ tasks.md
```

### Source Code
```text
backend/app/
├── domain/       simulation.py (NUEVO) · scenarios.py (NUEVO)
├── services/     ports.py (NUEVO: EventPublisher, NullPublisher) · alert_service.py (publisher, eventos tras commit, create_from_event, simulate_event) · scenario_service.py (NUEVO) · health_service.py (running, belowThreshold)
├── repositories/ settings_repo.py (+ increment, get_int)
├── infrastructure/ event_bus.py (NUEVO) · simulator.py (NUEVO) · seed/__init__.py (+ stats.below_threshold)
├── api/          deps.py (+ PublisherDep, SimulatorDep) · routers/stream.py (NUEVO) · routers/demo.py (NUEVO) · routers/alerts.py (inyecta el publisher) · routers/health.py · schemas/demo.py (NUEVO) · schemas/catalog.py (HealthOut)
└── main.py       (lifespan: bus.bind_loop, simulator.start/stop; routers stream y demo)

frontend/src/
├── domain/        liveEvents.ts (tipos de evento y de datos)
├── infrastructure/ sse.ts
├── application/   useLiveEvents.ts · stores/liveStatus.ts · stores/notifications.ts · stores/toasts.ts (máx. 3 no persistentes) · hooks/useAlertCounts.ts · queryKeys.ts (+ alerts.counts)
└── presentation/  layout/{Shell, Topbar (indicador + campana), Sidebar (badge), ConnectionBanner (NUEVO)} · components/NotificationsPopover.tsx (NUEVO) · pages/AlertsPage.tsx (en vivo, píldora) · features/alerts/AlertTable.tsx (resaltado de varios ids)
```

**Structure Decision**: el mismo monorepo; módulos nuevos en las capas correspondientes.

## Complexity Tracking

No aplica.
