# Implementation Plan: Configuración y control de la demo

**Branch**: `008-configuracion-demo` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

**Backend**
- `SettingsService`: `get` y `update` parcial, con validación en el dominio, el evento `settings_updated` en la timeline y `settings.updated` por SSE.
- `DemoService.reset`: con un lock global, pausa el simulador, ejecuta `drop_all` y `create_all` y luego `seed_all(now)`, restaura el simulador, registra `demo_reset` y emite `demo.reset`.
- El simulador expone `next_run_at`.
- `alert.created` incluye `triggeredBy` cuando la alerta viene de un escenario.

**Frontend**
- `SettingsPage` con 4 tarjetas: Simulador, Escenarios, Umbrales y Zona de peligro.
- `useLiveEvents` filtra los avisos por `actorId` **o** `triggeredBy`.

## Technical Context

Sin dependencias · Python 3.12 / TS 5 · SQLite (el reinicio recrea las tablas) · sin pruebas; [quickstart.md](quickstart.md).

## Decisions

- **R1. Validación (domain/settings_rules.py).**
  - Intervalo: entero de 15 a 300.
  - Umbral: de 0.50 a 0.99, con 2 decimales.
  - Los tipos deben existir y tener umbral; `reporte_operador` no lo tiene.
  - Los errores se devuelven como `DomainError(VALIDACION, fields)`.
- **R2. Settings.**
  - `GET /api/settings` (supervisor) devuelve `{ simulator: {enabled, intervalSeconds, running, nextRunAt}, thresholds: {code: value}, belowThreshold }`.
  - `PUT /api/settings` (supervisor) recibe un cuerpo parcial con la misma forma (sin los campos de solo lectura). En una transacción hace el upsert de `app_settings` y añade un `TimelineEvent(action=settings_updated, actor, payload=cambios)` sin `alert_id` ni `incident_id`; tras el commit publica `settings.updated` con el estado completo.
  - El simulador ya relee la configuración cada 5 s (003), así que el cambio se aplica en caliente.
- **R3. `next_run_at`.** `Simulator` guarda la hora programada del próximo tick (o `None` si está apagado). `SimulatorDep` lo expone y `SettingsService.get` lo recibe como parámetro desde `api`, igual que `running` en health.
- **R4. Reinicio.**
  - `infrastructure/demo_reset.py::DemoResetter(engine, simulator, bus)`, con un `threading.Lock`.
  - Pasos:
    1. Lee la configuración actual del simulador.
    2. `await simulator.pause()`: cancela la espera y marca `paused`.
    3. Dentro del lock: `SQLModel.metadata.drop_all` + `create_all` + `seed_all(session, now)`.
    4. Reescribe `simulator.enabled` e `interval_seconds` con los valores previos; los umbrales quedan en sus valores por defecto.
    5. Inserta `TimelineEvent(demo_reset, actor)`.
    6. Reanuda el simulador.
    7. Publica `demo.reset {resetAt, actorId}`.
    8. Devuelve `{alerts, incidents, resetAt}`.
  - Va en `infrastructure` porque recrea el esquema y orquesta el simulador.
  - El router `POST /api/demo/reset` (supervisor) llama a `DemoService` en services, que delega en un puerto `DemoResetPort` (Protocol) implementado por `DemoResetter`. Así services no importa infrastructure.
- **R5. `triggeredBy`.** `ScenarioService.trigger` crea la alerta y publica `alert.created` con `actorId: null` (Sistema) y `triggeredBy: <supervisor>`. En el frontend, `useLiveEvents` omite el toast si `actorId === me || triggeredBy === me`. El contrato se actualiza en el doc 08 §3.7.
- **R6. Frontend.**
  - `domain/settings.ts`: rangos y validación en el cliente.
  - `infrastructure/api/settings.ts` y `api/demo.ts` (scenarios, trigger, reset).
  - Hooks: `useSettings`, `useUpdateSettings`, `useScenarios`, `useTriggerScenario` (toast "Escenario E-1 disparado: ALT-xxxx" con "Ver alerta") y `useResetDemo`.
  - `features/settings/`:
    - `SimulatorCard`: switch accesible (`role="switch"`), un slider más input numérico, "Guardar" y el estado ("Simulador detenido" o "Próximo evento en ~N s", con una cuenta regresiva local).
    - `ScenarioCards`.
    - `ThresholdsTable`: inputs con `step` 0.01, errores en línea y "Guardar cambios" solo si hay cambios.
    - `DangerZone`: Dialog con un input que exige `REINICIAR` exacto y el botón danger.
  - `pages/SettingsPage.tsx` dentro de `RequireSupervisor`.
  - `useLiveEvents` ya gestiona `settings.updated` (invalida `settings.all`) y `demo.reset` (limpia la caché y va al Resumen).

## Constitution Check

| Principio | Estado |
|---|---|
| II. Capas | ✅ Validación en domain; servicios con puertos; reset en infrastructure detrás de un Protocol |
| III. Humano en el bucle | ✅ Reinicio con confirmación escrita; cada cambio registrado con su actor |
| IV. Transparencia | ✅ Estado del simulador visible |
| VII-VIII | ✅ |

## Project Structure

```text
backend/app/domain/settings_rules.py
backend/app/services/{settings_service.py, demo_service.py, ports.py (+ DemoResetPort), scenario_service.py (triggeredBy)}
backend/app/infrastructure/{simulator.py (+ next_run_at, pause/resume), demo_reset.py}
backend/app/api/{schemas/settings.py, routers/settings.py, routers/demo.py (+ reset)}; deps.py; main.py
frontend/src/domain/settings.ts · infrastructure/api/{settings.ts, demo.ts} · application/hooks/{useSettings, useUpdateSettings, useScenarios, useTriggerScenario, useResetDemo}.ts · application/useLiveEvents.ts (triggeredBy)
frontend/src/presentation/features/settings/{SimulatorCard, ScenarioCards, ThresholdsTable, DangerZone}.tsx · pages/SettingsPage.tsx · router.tsx
```
