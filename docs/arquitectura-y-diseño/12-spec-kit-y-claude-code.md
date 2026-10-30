# 12 · Insumos para Spec Kit y configuración de Claude Code

Este documento conecta la documentación aprobada (docs 01-11) con el desarrollo guiado por especificaciones. Contiene:

1. La configuración de **GitHub Spec Kit**.
2. El texto base de la **constitución**.
3. El desglose en **features**, con el prompt de `/speckit-specify` de cada una.
4. Las entradas de `/speckit-plan` y `/speckit-tasks`.
5. Los **agentes, skills y comandos** de Claude Code que hay que crear.
6. El `CLAUDE.md` del proyecto.

## 1. Preparación de Spec Kit

```powershell
# En la raíz del repositorio (requiere uv)
uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --integration claude --script ps --non-interactive
```

- Crea `.specify/` (plantillas, scripts de PowerShell y memoria con la constitución) y los skills `speckit-*` en `.claude/skills/`, que se invocan como `/speckit-specify`, `/speckit-plan`, etc.
- Los nombres de nuestros comandos propios (§5.3) **no** usan el prefijo `speckit-`, para evitar colisiones.

**Ciclo por feature**

`/speckit-specify` → `/speckit-clarify` (solo si quedan dudas) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement` → verificación manual (`/demo-walkthrough` parcial) → commit.

## 2. Constitución (`/speckit-constitution`)

Prompt sugerido:

> Crea la constitución de **AeroSecure AI (demo MVP)** con estos principios no negociables:
>
> 1. **La documentación manda.** `docs/docs-generales/` (01-05) y `docs/arquitectura-y-diseño/` (06-11) son la fuente de verdad. Si una especificación contradice la documentación, gana la documentación o se pregunta.
> 2. **Arquitectura por capas estricta.** Backend: `api → services → repositories → domain`, más `infrastructure` (db, event bus, simulador, seed). Frontend: `presentation → application → domain`, con `infrastructure` como adaptadores. Solo se importa hacia capas inferiores; `domain` no depende de nada del proyecto. Las reglas de negocio viven solo en `domain` y `services`.
> 3. **Humano en el bucle.** Ninguna alerta se convierte en incidente sin confirmación humana. Las acciones irreversibles (confirmar, descartar, escalar, resolver, reiniciar) piden confirmación. Toda acción registra actor y hora en `timeline_events`.
> 4. **Transparencia de la IA simulada.** Banner de modo demostración permanente. Las predicciones se etiquetan como demostrativas, el score es explicable y nunca se presenta una alerta como prueba de una amenaza.
> 5. **Privacidad por diseño.** Sin datos personales reales, rostros ni biometría. Evidencia solo con ilustraciones.
> 6. **Accesibilidad.** La severidad y el estado se comunican con icono, texto y color; contraste AA; uso con teclado; diálogos con foco atrapado.
> 7. **Simplicidad y coste cero.** Solo el stack aprobado (FastAPI, uv, SQLite, SQLModel; React, Vite, TS, Tailwind, Recharts, Three.js, TanStack Query, React Router, lucide; Bun). Sin servicios externos, claves ni nube. Una dependencia nueva requiere justificación en el plan.
> 8. **Sin pruebas automatizadas.** Por decisión del proyecto no se escriben pruebas unitarias, de integración ni E2E, y **las tareas no deben incluirlas**. La calidad se asegura con TypeScript estricto, type hints, `ruff`, `eslint`, `tsc --noEmit` y la verificación manual del doc 11.
> 9. **Ejecución local con un solo comando.** `start-demo.ps1` levanta todo; la base de datos se siembra sola.
> 10. **Idioma.** Interfaz y documentación en español; código (identificadores, tablas, rutas de API) en inglés; los valores de enum siguen el doc 05 (`nueva`, `critica`…).

## 3. Features (`/speckit-specify`)

Orden de implementación. Cada feature es un incremento que se puede demostrar.

| # | Feature (rama) | Alcance | Docs | Depende de |
|---|---|---|---|---|
| 001 | `001-fundacion` | Monorepo, esqueleto por capas (back y front), `start-demo.ps1`, DB y catálogos sembrados, `GET /users /zones /teams /alert-types /health`, shell de la UI (Sidebar, Topbar, DemoBanner), login simulado, tokens de diseño y componentes base | 06, 07 §3, 09 §1-2, §5 | — |
| 002 | `002-alertas` | Dominio de la alerta (enums, máquina de estados, score), alertas activas sembradas, `GET/POST /alerts`, `POST /alerts/{id}/actions`, lista con filtros, detalle completo, acciones con diálogos, reporte manual, evidencia SVG | 05 §2, §4-5, 08 §3.3, 09 §3.3-3.4, §3.11, 10 §4-6 | 001 |
| 003 | `003-tiempo-real` | Event bus, `GET /api/stream`, simulador con umbrales, escenarios (endpoint), `useLiveEvents`, toasts, contador, indicador "En vivo" | 04 F3, 08 §3.7, 10 §7-8 | 002 |
| 004 | `004-incidentes` | Incidente creado al confirmar, máquina de estados, `GET /incidents`, `POST /incidents/{id}/actions`, registro, detalle, timeline combinada, histórico de 30 días | 05 §3, 08 §3.4, 09 §3.5-3.6, 10 §3-4 | 002 |
| 005 | `005-resumen` | `GET /dashboard/summary`, página Resumen (KPIs, prioritarias, mini-mapa 2D, dona, tendencia, anomalías) y botón "Críticas (N)" | 05 §6-7, 09 §3.2 | 003, 004 |
| 006 | `006-mapa-3d` | Escena Three.js, zonas por riesgo, etiquetas, marcadores, interacción, panel lateral, fallback 2D | 09 §3.7, 07 §3.1 | 005 |
| 007 | `007-analisis-reportes` | `/analytics/*`, anomalías, página Análisis, `/reports/incidents.csv`, página Reportes | 05 §6-7, 08 §3.5, 09 §3.8-3.9 | 004 |
| 008 | `008-configuracion-demo` | `GET/PUT /settings`, `POST /demo/reset`, `/demo/scenarios`, página Configuración, evento `demo.reset` | 04 F5, 08 §3.6, 09 §3.10 | 003 |
| 009 | `009-pulido-demo` | Estados de carga, vacío y error en todas las vistas, accesibilidad, responsive tablet, microcopy, recorrido completo del guion | 09 §4, §6-8, 11 | todas |

**Plantilla del prompt de `/speckit-specify`** (ejemplo con la feature 002):

> Especifica la feature **002-alertas** de AeroSecure AI. Fuente de verdad: `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§2, §4, §5), `docs/arquitectura-y-diseño/08-especificacion-api.md` (§2, §3.3), `docs/arquitectura-y-diseño/09-ui-ux.md` (§3.3, §3.4, §3.11) y `docs/arquitectura-y-diseño/10-datos-simulados-y-simulador.md` (§4-6). Historias: HU-04, HU-06, HU-10 a HU-15 de `docs/docs-generales/02-actores-casos-de-uso-e-historias.md`. Requisitos: RF-C1 a RF-C7 y RF-H1-2 de `docs/docs-generales/03-requisitos.md`. Fuera de alcance: tiempo real (feature 003) e incidentes más allá de su creación al confirmar (feature 004). No incluyas pruebas automatizadas.

**Respuestas preparadas para `/speckit-clarify`**: si surgen preguntas, la respuesta debe estar en la documentación. Si no está, se decide con el usuario y **se actualiza el doc correspondiente** antes de seguir.

## 4. Entradas de `/speckit-plan` y `/speckit-tasks`

**`/speckit-plan`** (mismo texto base para todas las features):

> Stack: backend en Python 3.12, FastAPI, SQLModel y SQLite, gestionado con uv, con SSE mediante StreamingResponse. Frontend en React 18, Vite, TypeScript estricto, Tailwind, TanStack Query, React Router, Recharts, Three.js y lucide-react, gestionado con Bun. Respeta la arquitectura por capas y la estructura de carpetas de `docs/arquitectura-y-diseño/06-arquitectura.md` §2-3, el modelo de `07-modelo-de-datos.md` y el contrato de API de `08-especificacion-api.md` (camelCase, cabecera X-Actor-Id, formato de error). No añadas dependencias fuera de esta lista sin justificarlo. Sin pruebas automatizadas.

**`/speckit-tasks`**: añadir siempre:

> Ordena las tareas por capas: domain → repositories → services → api, y luego infrastructure del front → application → presentation. Marca con [P] las tareas paralelizables. No generes tareas de tests. La última tarea de cada feature es "Verificación manual" con los ítems del checklist del doc 11 que apliquen.

## 5. Configuración de Claude Code

Ubicación: `.claude/` en la raíz. Son archivos versionados con el proyecto.

### 5.1 Agentes (`.claude/agents/*.md`)

| Agente | Rol | Herramientas | Cuándo se usa |
|---|---|---|---|
| `backend-engineer` | Implementa tareas del backend respetando las capas y el contrato de API. Carga los skills `aerosecure-domain` y `fastapi-layered` | Read, Edit, Write, Bash, Grep, Glob | Tareas de `/speckit-implement` en `backend/` |
| `frontend-engineer` | Implementa páginas, hooks y clientes siguiendo el sistema visual y los estados de UI. Carga `react-layered-ui` y `aerosecure-domain` | Read, Edit, Write, Bash, Grep, Glob | Tareas en `frontend/src` (salvo `map3d`) |
| `map3d-engineer` | Construye la escena Three.js (zonas, etiquetas, marcadores, raycasting, fallback 2D, rendimiento). Carga `threejs-terminal-map` | Read, Edit, Write, Bash | Feature 006 |
| `layer-guardian` | Revisor **de solo lectura**: verifica importaciones entre capas, reglas de dominio (doc 05), contrato de API (doc 08), accesibilidad básica y que no haya pruebas ni dependencias no aprobadas. Devuelve hallazgos priorizados | Read, Grep, Glob, Bash (solo lectura) | Al cerrar cada feature y antes del commit |
| `demo-runner` | Levanta la app, reinicia la demo, recorre el guion del doc 11 llamando a la API (y al navegador si está disponible) y reporta el checklist como cumplido, fallido o no verificable | Read, Bash, (navegador opcional) | Al cerrar cada feature y antes de presentar |

Estructura de cada archivo de agente:

```markdown
---
name: backend-engineer
description: Implementa tareas del backend de AeroSecure AI (FastAPI por capas). Úsalo para cualquier cambio en backend/.
tools: Read, Edit, Write, Bash, Grep, Glob
---
Eres el ingeniero backend de AeroSecure AI. Fuente de verdad: docs/docs-generales/05 y docs/arquitectura-y-diseño/06, 07, 08, 10.
Reglas: (1) capas api→services→repositories→domain; (2) toda escritura inserta timeline_events en la misma transacción;
(3) errores de dominio como DomainError; (4) sin pruebas automatizadas; (5) al terminar ejecuta `uv run ruff check` …
```

### 5.2 Skills (`.claude/skills/<nombre>/SKILL.md`)

| Skill | Contenido | Archivos de apoyo |
|---|---|---|
| `aerosecure-domain` | Resumen operativo de los estados, transiciones, severidades, tipos, la fórmula del score, las métricas y las anomalías, con enlaces a los docs 05, 07 y 10 | `reference.md` (tablas condensadas) |
| `fastapi-layered` | Receta "añadir un endpoint de punta a punta": DTO → router → servicio → repositorio → dominio; manejo de `DomainError`; `X-Actor-Id`; publicación de eventos; paginación | `templates/router.py`, `service.py`, `repository.py` |
| `react-layered-ui` | Receta "añadir una página, un hook y un cliente"; uso de TanStack Query y de las claves de query; invalidación por SSE; componentes base; estados de carga, vacío y error; tokens; reglas de accesibilidad | `templates/page.tsx`, `useResource.ts`, `api-client.ts` |
| `threejs-terminal-map` | Convenciones de la escena (unidades en metros, cámara, luces, colores por riesgo, `CSS2DRenderer`, raycasting, render bajo demanda, liberación de recursos, fallback) | `scene-skeleton.ts` |
| `demo-ops` | Cómo arrancar, reiniciar, disparar escenarios, apagar el simulador y diagnosticar (doc 11 §4) | `scripts/*.ps1` |

### 5.3 Comandos (`.claude/commands/*.md`)

| Comando | Argumentos | Qué hace |
|---|---|---|
| `/dev-up` | — | Ejecuta `start-demo.ps1` en segundo plano y comprueba `/api/health` y `:5173` |
| `/demo-reset` | — | `POST /api/demo/reset` como `sup-a` y muestra los conteos |
| `/demo-scenario` | `E-1`…`E-4` | Dispara el escenario indicado |
| `/new-endpoint` | `<recurso> <acción>` | Usa `fastapi-layered` para crear el endpoint en todas las capas, según el doc 08 |
| `/new-page` | `<ruta>` | Usa `react-layered-ui` para crear la página, el hook y el cliente, y registra la ruta en el router y el sidebar |
| `/check-layers` | — | `ruff check`, `eslint`, `tsc --noEmit` y una búsqueda de importaciones prohibidas entre capas; resume los hallazgos |
| `/demo-walkthrough` | `[parcial <feature>]` | Lanza el agente `demo-runner` con el guion del doc 11 (completo, o solo los ítems de una feature) |

### 5.4 `CLAUDE.md` del proyecto (raíz)

Contenido mínimo:
- Qué es AeroSecure AI (2 líneas) y el enlace a `docs/README.md`.
- Stack y comandos: `uv sync`, `bun install`, `./start-demo.ps1`, linters.
- Las reglas de la constitución en forma de lista corta: capas, humano en el bucle, sin pruebas, sin dependencias nuevas, idioma.
- El flujo de trabajo: Spec Kit por feature (§1) y el uso de los agentes, skills y comandos (§5).
- La convención de commits: `feat(002-alertas): …`.

### 5.5 Permisos sugeridos (`.claude/settings.json`)

Permitir sin preguntar: `uv run *`, `uv sync`, `bun install`, `bun run *`, `bunx tsc *`, `bunx eslint *`, `curl http://localhost:8000/*`, y lecturas y búsquedas en el repositorio.

## 6. Orden de arranque del proyecto (siguiente paso)

1. `git init` (si aplica) y `.gitignore` (Python, Bun, `backend/data/*.db`, `.archify` de trabajo).
2. Inicializar Spec Kit (§1).
3. Crear `CLAUDE.md`, los agentes, los skills y los comandos (§5).
4. Ejecutar `/speckit-constitution` con el prompt del §2.
5. Ejecutar el ciclo de la feature **001-fundacion**.
