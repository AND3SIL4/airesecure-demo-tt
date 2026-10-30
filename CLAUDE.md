# AeroSecure AI · Demo MVP

Plataforma de seguridad aeroportuaria inteligente (demo local). La IA prioriza las alertas; **la decisión siempre es humana**.
Documentación completa: [`docs/README.md`](docs/README.md). Constitución: [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Fuente de verdad
- `docs/docs-generales/`: 01 visión, 02 casos de uso e historias (UC/HU), 03 requisitos (RF/RNF), 04 flujos, 05 estados y reglas de dominio.
- `docs/arquitectura-y-diseño/`: 06 arquitectura, 07 modelo de datos, 08 API, 09 UI/UX, 10 datos simulados, 11 guion y aceptación, 12 Spec Kit y Claude Code.
- Si algo no está en la documentación, **pregunta** antes de inventar, y actualiza el doc tras la decisión.

## Stack y comandos
| Tarea | Comando |
|---|---|
| Dependencias del backend | `cd backend; uv sync` |
| Dependencias del frontend | `cd frontend; bun install` |
| Levantar todo | `./start-demo.ps1` (API en `:8000`, `/docs`; web en `:5173`) |
| Lint del backend | `cd backend; uv run ruff check . ; uv run ruff format --check .` |
| Lint y tipos del frontend | `cd frontend; bun run lint ; bunx tsc --noEmit` |

Node.js **no** está instalado: usa siempre `bun` y `bunx`.

## Reglas no negociables (resumen de la constitución)
1. **Capas**: back `api → services → repositories → domain` (+ `infrastructure`); front `presentation → application → domain` (+ `infrastructure`). Solo se importa hacia abajo y `domain` no importa nada.
2. **Humano en el bucle**: confirmar, descartar, escalar, resolver y reiniciar piden confirmación; toda escritura inserta `timeline_events` con el actor en la misma transacción.
3. **Transparencia**: banner de modo demostración, score con su desglose, etiquetas de "demostrativo" y "basado en reglas".
4. **Privacidad**: sin datos personales ni rostros; evidencia como ilustraciones SVG.
5. **Accesibilidad**: severidad y estado con icono, texto y color; teclado; contraste AA; estados de carga, vacío, error y éxito.
6. **Sin pruebas automatizadas**: no escribas tests ni crees tareas de tests. La calidad se asegura con linters, tipos y el checklist del doc 11.
7. **Sin dependencias nuevas** fuera del stack aprobado sin justificarlo en `plan.md`.
8. **Idioma**: UI y docs en español; código en inglés; enums según el doc 05; API en camelCase con `X-Actor-Id`.

## Flujo de trabajo (Spec Kit)
Una feature por rama, en el orden del doc 12 §3 (`001-fundacion` … `009-pulido-demo`):
`/speckit-specify` → (`/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement` → agente `layer-guardian` → `/check-layers` → `/demo-walkthrough parcial <feature>` → commit `feat(NNN-nombre): …`.

## Recursos de Claude Code del proyecto
- **Agentes** (`.claude/agents/`): `backend-engineer`, `frontend-engineer`, `map3d-engineer`, `layer-guardian` (revisor de solo lectura), `demo-runner`.
- **Skills** (`.claude/skills/`): `aerosecure-domain`, `fastapi-layered`, `react-layered-ui`, `threejs-terminal-map`, `demo-ops` (más los `speckit-*` de Spec Kit).
- **Comandos** (`.claude/commands/`): `/dev-up`, `/demo-reset`, `/demo-scenario`, `/new-endpoint`, `/new-page`, `/check-layers`, `/demo-walkthrough`.

## Convenciones
- IDs legibles: `ALT-2001…`, `INC-0401…`, `CAM-T1-034`; usuarios `op-01`, `op-02`, `sup-a`.
- Fechas en UTC en la base de datos y la API; se muestran en America/Bogota (`es-CO`).
- Commits: `feat|fix|docs|chore(scope): descripción en español`.
