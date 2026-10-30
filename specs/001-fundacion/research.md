# Research: 001-fundacion

Decisiones técnicas para resolver las incógnitas del Technical Context. El stack base ya está aprobado en la constitución y en el doc 06; aquí solo se fijan versiones y patrones concretos.

## R1. Versión de Python y gestión con uv
- **Decision**: fijar `requires-python = ">=3.12,<3.13"` y `.python-version` = `3.12`, de modo que uv descarga y gestiona su propio intérprete 3.12.
- **Rationale**: el equipo tiene instalado Python 3.15 (pre-release), para el que pueden faltar wheels compilados de `pydantic-core`. Un 3.12 gestionado por uv da builds reproducibles.
- **Alternatives considered**: usar el Python del sistema (riesgo de incompatibilidades); `>=3.12` sin techo (uv podría elegir 3.15).

## R2. Dependencias del backend
- **Decision**: `fastapi`, `uvicorn[standard]`, `sqlmodel`; dev: `ruff`. Nada más.
- **Rationale**: es el mínimo para la API, el ORM y el servidor. `StreamingResponse` (SSE, feature 003) viene incluido en Starlette.
- **Alternatives considered**: `sse-starlette` (dependencia extra innecesaria); `alembic` (no hace falta: la base se recrea con la semilla).

## R3. Creación y siembra idempotente de SQLite
- **Decision**: en el `lifespan` de FastAPI se hace `SQLModel.metadata.create_all(engine)`, se activa `PRAGMA foreign_keys=ON` en cada conexión y `seed_catalogs(session)` hace un *upsert* por clave primaria (`session.merge`). Si la base no se puede abrir o falla la verificación de integridad (`PRAGMA quick_check`), se renombra a `*.corrupt-<ts>` y se recrea.
- **Rationale**: cumple FR-002/FR-003 y el edge case de base corrupta sin pasos manuales.
- **Alternatives considered**: borrar y recrear siempre (perdería los datos operativos de las features siguientes entre reinicios); migraciones (excesivo para una demo).

## R4. Fechas y zona horaria
- **Decision**: guardar `datetime` en UTC con `tzinfo` normalizado. SQLite almacena el texto ISO; el modelo lo convierte con un helper `utcnow()`. La API serializa en ISO 8601 con `Z`. El frontend formatea con `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })`.
- **Rationale**: es el doc 05 §8.4 y RNF-06, y evita librerías de fechas.
- **Alternatives considered**: date-fns o dayjs (dependencias evitables).

## R5. DTOs en camelCase y formato de error
- **Decision**: una base `ApiModel(BaseModel)` con `ConfigDict(alias_generator=to_camel, populate_by_name=True)` y los routers con `response_model_by_alias=True`. Hay *exception handlers* para `DomainError`, `RequestValidationError` (→ 422 `VALIDACION` con `details.fields`), `StarletteHTTPException` 404 (→ `NO_ENCONTRADO`) y `Exception` (→ 500 `ERROR_INTERNO`).
- **Rationale**: un único punto garantiza FR-007 y FR-008.
- **Alternatives considered**: devolver las tablas de SQLModel directamente (mezclaría el contrato de la API con la persistencia y violaría las capas).

## R6. Identificación del actor
- **Decision**: la dependencia `get_actor(x_actor_id: str | None = Header(None))` busca el usuario vía `CatalogService`; si falta o no existe → `DomainError(ACTOR_REQUERIDO)` (la capa `api` lo mapea a 401). `require_supervisor` encadena `get_actor` y valida el rol → 403 `SOLO_SUPERVISOR`. Para que el mecanismo sea verificable desde esta feature y útil para el frontend, se añade **`GET /api/me`** (devuelve el usuario del `X-Actor-Id`). Se documenta en el doc 08 §3.1.
- **Rationale**: en 001 no hay endpoints de escritura; `/api/me` permite verificar el 401 y que el front valide el perfil guardado.
- **Alternatives considered**: una ruta "interna" oculta (confusa); posponer la verificación hasta la feature 002 (deja FR-009 sin comprobar).

## R7. Frontend: versiones y herramientas
- **Decision**: React 18.3 + react-dom; Vite 6 con `@vitejs/plugin-react`; TypeScript 5 (`strict`); **Tailwind CSS v4** con `@tailwindcss/vite` (tokens con `@theme` en `src/index.css`, sin `tailwind.config.ts` ni PostCSS); `@tanstack/react-query` v5; `react-router-dom` v7 (modo librería); `lucide-react`; `@fontsource-variable/inter`; ESLint 9 (flat config) con `typescript-eslint`, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`. Recharts y Three.js se instalan en las features 005 y 006, cuando se usen.
- **Rationale**: es el stack aprobado con el menor número de piezas; Tailwind v4 elimina PostCSS y Autoprefixer. Todo funciona con Bun (`bun create vite`, `bun run dev`).
- **Alternatives considered**: Tailwind v3 (requiere PostCSS, Autoprefixer y archivo de config); React 19 (el doc 06 fija React 18); Biome en lugar de ESLint (el doc fija ESLint).
- **Nota**: el doc 06 §3 menciona `tailwind.config.ts`. Con v4 los tokens viven en `src/index.css`; es una diferencia de ubicación, no de stack.

## R8. Proxy, puertos y arranque
- **Decision**: Vite en `:5173` con `server.proxy['/api'] = 'http://localhost:8000'` (`strictPort: true`). Uvicorn en `:8000`. `start-demo.ps1`:
  1. Comprueba uv y bun.
  2. Comprueba que los puertos estén libres (`Get-NetTCPConnection`); si alguno está ocupado, informa del puerto en conflicto y sale.
  3. Ejecuta `uv sync` y `bun install` si faltan `.venv` o `node_modules`.
  4. Lanza ambos procesos en ventanas propias (`Start-Process`).
  5. Espera a `/api/health` y abre el navegador.
- **Rationale**: un solo comando (RNF-01) y el edge case de puerto ocupado.
- **Alternatives considered**: `concurrently` (requiere Node y una dependencia más); Docker (fuera de alcance y con coste de tiempo).

## R9. Persistencia del perfil y protección de rutas
- **Decision**: un store mínimo (`useSyncExternalStore` sobre `localStorage['aerosecure.actor']`) en `application/stores/actor.ts`. `RequireActor` valida el perfil contra `useUsers()` (catálogo) y redirige a `/login`; `RequireSupervisor` redirige a `/` con un toast. `http.ts` lee el actor del store para la cabecera `X-Actor-Id`.
- **Rationale**: sin librerías de estado (Zustand, Redux): basta con React.
- **Alternatives considered**: Zustand (dependencia no aprobada); Context puro (re-renders y sin acceso fuera de React para `http.ts`).

## R10. Componentes accesibles sin librería de UI
- **Decision**:
  - `Dialog` con el elemento nativo `<dialog>` + `showModal()` (foco atrapado y Esc nativos), devolviendo el foco al disparador.
  - `Tooltip` con `aria-describedby` y visibilidad en hover y focus.
  - `Toast` con una región `aria-live`.
  - Iconos lucide en `SeverityBadge` y `StatusBadge`.
- **Rationale**: cubre FR-023 sin dependencias (Radix y Headless UI no están en el stack aprobado).
- **Alternatives considered**: Radix UI (calidad alta, pero es una dependencia extra no justificada para el alcance de la demo).

## R11. Geometría de las zonas (mapa)
- **Decision**: una losa de 120 × 80 m centrada en el origen, con +Z hacia la plataforma. Las coordenadas de cada zona están en `data-model.md`, sin solapes.
- **Rationale**: el doc 07 §3.1 delega la geometría en la semilla; se fija aquí para que las features 005 y 006 la reutilicen.
