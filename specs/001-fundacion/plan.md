# Implementation Plan: Fundación de la demo

**Branch**: `001-fundacion` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-fundacion/spec.md`

## Summary

Crear el monorepo de AeroSecure AI con un backend FastAPI por capas (uv, SQLite sembrada de forma idempotente con los catálogos del doc 07), los endpoints de salud, catálogos y `/me`, el actor por `X-Actor-Id` y el formato de error común. Crear también un frontend React/Vite/TS/Tailwind por capas (Bun) con el shell completo (banner de demo, sidebar por rol, topbar con reloj UTC-5), el login simulado persistente, las rutas con guardias y placeholders, los tokens de diseño y los componentes base accesibles. Todo se arranca con `start-demo.ps1`. Detalles de las decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: Python 3.12 (gestionado por uv); TypeScript 5 (strict) con React 18.3

**Primary Dependencies**:
- Backend: FastAPI, uvicorn[standard] y SQLModel; ruff (dev).
- Frontend: Vite 6, @vitejs/plugin-react, Tailwind CSS v4 (@tailwindcss/vite), @tanstack/react-query v5, react-router-dom v7, lucide-react y @fontsource-variable/inter; ESLint 9 + typescript-eslint.
- Recharts y Three.js se añaden en las features 005 y 006.

**Storage**: SQLite (`backend/data/aerosecure.db`)

**Testing**: ninguno, por la constitución VIII. Verificación manual con [quickstart.md](quickstart.md), más ruff, eslint y `tsc --noEmit`.

**Target Platform**: Windows 11 local; Chrome y Edge actuales

**Project Type**: aplicación web (backend + frontend en un monorepo)

**Performance Goals**: vistas en < 1 s en local; arranque utilizable en < 60 s

**Constraints**: offline una vez instaladas las dependencias; coste cero; sin Node.js (usar Bun); puertos fijos 8000 y 5173

**Scale/Scope**: 3 usuarios simulados, ~40 registros de catálogo, 10 rutas de UI y 7 endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento en 001 | Estado |
|---|---|---|
| I. La documentación manda | La spec cita los docs 02, 03 y 05-09. `/api/me` (nuevo) se añade al doc 08 §3.1 | ✅ |
| II. Capas estrictas | Estructura `api/services/repositories/domain/infrastructure` y `presentation/application/domain/infrastructure`; routers sin SQL; componentes sin fetch | ✅ |
| III. Humano en el bucle | No hay escrituras de negocio; el mecanismo de actor (`get_actor`) queda listo; `ConfirmDialog` disponible | ✅ |
| IV. Transparencia | DemoBanner permanente en todas las vistas, incluido el login | ✅ |
| V. Privacidad | Solo alias ficticios; sin imágenes de personas | ✅ |
| VI. Accesibilidad | Badges con icono y texto, `<dialog>` nativo, foco visible, aria-live, reduced-motion, estados de UI | ✅ |
| VII. Simplicidad y coste cero | Solo el stack aprobado. `@fontsource-variable/inter` (la variante variable del paquete aprobado) y las herramientas de ESLint y Vite son tooling del stack aprobado | ✅ |
| VIII. Sin pruebas | Ninguna tarea de pruebas; quickstart manual | ✅ |
| IX. Un comando | `start-demo.ps1` con siembra automática | ✅ |
| X. Idioma | UI y docs en español; código en inglés; enums según el doc 05; camelCase y X-Actor-Id | ✅ |

**Re-check post-design**: ✅ sin violaciones. La sección Complexity Tracking no aplica.

## Project Structure

### Documentation (this feature)

```text
specs/001-fundacion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-catalogs.md
│   └── ui-routes.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
start-demo.ps1
backend/
├── pyproject.toml  .python-version  uv.lock
├── data/.gitkeep
└── app/
    ├── main.py                 # app, lifespan (init_db + seed), CORS dev, routers /api, handlers
    ├── config.py               # DB_PATH, APP_VERSION, DISPLAY_TZ
    ├── api/
    │   ├── deps.py             # get_session, get_actor, require_supervisor
    │   ├── errors.py           # register_error_handlers(app)
    │   ├── schemas/
    │   │   ├── base.py         # ApiModel (camelCase)
    │   │   └── catalog.py      # UserOut, ZoneOut, TeamOut, AlertTypeOut, DismissReasonOut, HealthOut
    │   └── routers/
    │       ├── health.py       # GET /health
    │       └── catalog.py      # GET /users /me /zones /teams /alert-types /dismiss-reasons
    ├── services/
    │   ├── catalog_service.py  # listas, zonas con riskLevel (normal), resolve_actor
    │   └── health_service.py
    ├── repositories/
    │   ├── catalog_repo.py
    │   └── settings_repo.py
    ├── domain/
    │   ├── enums.py  models.py  errors.py  catalogs.py   # constantes de dominio (pesos, etiquetas)
    └── infrastructure/
        ├── db.py               # engine, PRAGMA FK, init_db (quick_check + recreate)
        └── seed/
            ├── __init__.py     # seed_catalogs(session)
            └── catalogs.py     # datos del data-model.md
frontend/
├── package.json  bun.lock  vite.config.ts  tsconfig*.json  eslint.config.js  index.html
└── src/
    ├── main.tsx  App.tsx  router.tsx  index.css     # @theme tokens (Tailwind v4)
    ├── domain/         types.ts  severity.ts  status.ts  format.ts  navigation.ts
    ├── infrastructure/ http.ts  api/catalog.ts
    ├── application/    queryClient.ts  queryKeys.ts  hooks/useUsers.ts  stores/actor.ts  stores/toasts.ts
    └── presentation/
        ├── layout/     Shell.tsx  Sidebar.tsx  Topbar.tsx  DemoBanner.tsx  Clock.tsx  RequireActor.tsx  RequireSupervisor.tsx
        ├── components/ Button  SeverityBadge  StatusBadge  Card  KpiCard  Dialog  ConfirmDialog  Toaster  Tooltip  Skeleton  EmptyState  ErrorState
        └── pages/      LoginPage.tsx  PlaceholderPage.tsx  NotFoundPage.tsx
```

**Structure Decision**: un monorepo con `backend/` y `frontend/` según el doc 06 §3. Las capas siguen el doc 06 §2. Las carpetas `services/ports.py`, `event_bus` y `simulator` se crean en la feature 003, cuando se usen.

## Complexity Tracking

No aplica (sin violaciones).
