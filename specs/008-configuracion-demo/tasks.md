---
description: "Lista de tareas de la feature 008-configuracion-demo"
---

# Tasks: Configuración y control de la demo

**Tests**: **no hay tareas de pruebas** (constitución VIII).

## Phase 1: Backend
- [x] T001 [P] Crear `backend/app/domain/settings_rules.py` (plan R1).
- [x] T002 Crear `backend/app/services/settings_service.py` (`get(simulator_running, next_run_at)` y `update(changes, actor)` con la timeline y el evento tras el commit; plan R2).
- [x] T003 Ampliar `backend/app/infrastructure/simulator.py` con `next_run_at` y `pause()`/`resume()`, sin romper el ciclo de 003.
- [x] T004 Crear `backend/app/infrastructure/demo_reset.py` (`DemoResetter`, con lock; plan R4), el puerto `DemoResetPort` en `services/ports.py` y `services/demo_service.py` (`reset(actor)`).
- [x] T005 `triggeredBy` en `services/scenario_service.py` (plan R5).
- [x] T006 Crear `backend/app/api/schemas/settings.py`, `backend/app/api/routers/settings.py` (GET y PUT con SupervisorDep) y añadir `POST /demo/reset` a `api/routers/demo.py`; conectar `DemoResetter` en `main.py` y `deps.py`.

## Phase 2: Frontend
- [x] T007 [P] Crear `frontend/src/domain/settings.ts` (rangos, validación y textos) y ampliar `domain/types.ts` (`Settings`, `SettingsUpdate`, `ResetResult`, `Scenario`) y `domain/liveEvents.ts` (`triggeredBy`).
- [x] T008 [P] Crear `frontend/src/infrastructure/api/settings.ts` y `frontend/src/infrastructure/api/demo.ts`, y los hooks `useSettings`, `useUpdateSettings`, `useScenarios`, `useTriggerScenario` y `useResetDemo` (claves `settings.all` y `demo.scenarios`).
- [x] T009 Ajustar `frontend/src/application/useLiveEvents.ts` para omitir el toast si `triggeredBy === perfil activo`.
- [x] T010 Crear `frontend/src/presentation/features/settings/` (`SimulatorCard`, `ScenarioCards`, `ThresholdsTable` y `DangerZone`, según plan R6) y `frontend/src/presentation/pages/SettingsPage.tsx` con sus estados; registrar `/configuracion` en `router.tsx`, dentro de `RequireSupervisor`.

## Phase 3: Polish
- [x] T011 Documentar el doc 08 §3.6 (con un enlace al contrato), el §3.7 (`triggeredBy`) y el doc 10 §1 (qué conserva y qué restablece el reinicio).
- [x] T012 Actualizar los scripts de `.claude/skills/demo-ops/scripts/` si el contrato difiere (reset y simulator).
- [x] T013 Linters y build sin errores.
- [x] T014 Revisión del agente `layer-guardian`, aplicando los hallazgos bloqueantes e importantes.
- [x] T015 **Verificación manual**: quickstart #1-#10 y HU-26 a HU-29 del doc 11 §3; anotar el resultado en `checklists/requirements.md`.
