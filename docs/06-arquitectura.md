# 06 · Arquitectura por capas

📊 Diagramas:
- [Arquitectura por capas](diagramas/06-arquitectura-capas/arquitectura-capas.html)
- [Estructura propuesta del repositorio](diagramas/06-estructura-repositorio/estructura-repositorio.html)

## 1. Tecnologías y herramientas

### Backend
- **Python 3.12+:** lenguaje del servidor. Es sencillo, muy usado en IA y facilita conectar modelos reales en el futuro.
- **FastAPI:** framework de la API REST. Es rápido y genera la documentación OpenAPI en `/docs`.
- **uv:** gestor de paquetes y entornos de Python, reproducible (`uv sync`, `uv run`).
- **SQLite:** base de datos en un archivo local, sin servidor y sin costo.
- **SQLModel:** modelos de tabla y validación (sobre SQLAlchemy y Pydantic).
- **Server-Sent Events (SSE):** envío de eventos en tiempo real al navegador. Se implementa con `StreamingResponse`, sin dependencias extra.

### Frontend
- **React 18:** interfaz construida con componentes reutilizables.
- **TypeScript (modo estricto):** tipos para alertas, incidentes y usuarios.
- **Vite:** servidor de desarrollo y empaquetado, con proxy de `/api` a `:8000`.
- **Tailwind CSS:** estilos consistentes, responsive y accesibles.
- **Recharts:** gráficos del Resumen y de Análisis.
- **Three.js:** maqueta 3D de la terminal en la vista Mapa, con `OrbitControls` y geometría generada por código.
- **TanStack Query:** caché de datos del servidor, estados de carga y error, e invalidación por eventos SSE.
- **React Router:** rutas por vista.
- **lucide-react:** iconografía consistente.
- **Bun:** gestor de paquetes y ejecución del frontend (sustituye a Node.js).

### Herramientas de trabajo
- **GitHub Spec Kit:** especificación, plan y tareas a partir de esta documentación.
- **Claude Code:** desarrollo asistido, con agentes, skills y comandos propios del proyecto (ver doc 12).
- **Archify:** diagramas del proyecto.
- **Git:** control de versiones.
- **Ruff y ESLint:** linters de Python y TypeScript (sin suite de pruebas).

## 2. Principio de capas

**Regla de oro: cada capa solo importa capas inferiores. `domain` no importa nada del proyecto.**

### 2.1 Backend (`backend/app/`)

| Capa | Responsabilidad | Puede importar | No puede |
|---|---|---|---|
| `api/` | Routers de FastAPI, DTOs de entrada y salida (Pydantic, camelCase), mapeo de errores a HTTP, endpoint SSE, dependencias (`get_actor`, `get_session`) | `services`, `domain` | Acceder a repositorios o a SQL directamente |
| `services/` | Casos de uso: `AlertService`, `IncidentService`, `ScoringService`, `AnalyticsService`, `CatalogService`, `DemoService`, `SettingsService`. Orquestan transacciones, aplican el dominio y publican eventos | `repositories`, `domain`, puertos (`EventPublisher`) | Conocer FastAPI o HTTP |
| `repositories/` | Acceso a datos con SQLModel: consultas, filtros, paginación y generación de IDs | `domain`, `infrastructure.db` | Contener reglas de negocio |
| `domain/` | Entidades (tablas SQLModel), enums, `state_machine.py`, `scoring.py`, `anomalies.py`, errores de dominio | Solo librerías estándar y SQLModel | Importar otras capas |
| `infrastructure/` | `db.py` (engine y sesión), `event_bus.py` (pub/sub en memoria con `asyncio.Queue`), `simulator.py` (tarea en segundo plano), `seed/` (datos semilla) | `services` (solo el simulador, para invocar casos de uso), `domain` | — |

**Puertos:** `services` define la interfaz `EventPublisher` y `infrastructure.event_bus` la implementa. Así el bus se puede sustituir (por ejemplo, por Redis) sin tocar los servicios. Del mismo modo, `ScoringService` usa una función de dominio que más adelante puede reemplazarse por un modelo real.

**Errores:** el dominio lanza `DomainError(code, message, details)`. Un *exception handler* en `api` lo traduce a HTTP (ver doc 08).

### 2.2 Frontend (`frontend/src/`)

| Capa | Responsabilidad | Puede importar |
|---|---|---|
| `presentation/` | `pages/` (una por ruta), `components/` (UI reutilizable: `SeverityBadge`, `KpiCard`, `Timeline`, `ConfirmDialog`…), `layout/` (Sidebar, Topbar, DemoBanner), `map3d/` (escena de Three.js) | `application`, `domain` |
| `application/` | Hooks de casos de uso (`useAlerts`, `useAlertActions`, `useIncidents`, `useDashboard`, `useLiveEvents`), stores ligeros (perfil activo, toasts), `queryKeys.ts` | `infrastructure`, `domain` |
| `domain/` | Tipos (`Alert`, `Incident`, `Zone`…), enums, metadatos de severidad y estado (etiqueta, color, icono), acciones permitidas por estado | Nada |
| `infrastructure/` | `http.ts` (fetch con la cabecera `X-Actor-Id` y el manejo de errores), `sse.ts` (EventSource con reconexión), `api/*.ts` (un cliente por recurso) | `domain` |

Reglas:
- Los componentes de `presentation` **nunca** llaman a `fetch`; usan los hooks de `application`.
- Los eventos SSE se traducen en `application/useLiveEvents.ts` a `queryClient.invalidateQueries(...)` y a toasts.
- La escena de Three.js se aísla en `presentation/map3d/` y recibe datos por props. No consulta la API por su cuenta.

## 3. Estructura de carpetas

```
aerosecure-ai/
├─ .claude/                 # agentes, skills y comandos del proyecto (doc 12)
├─ .specify/  specs/        # Spec Kit
├─ docs/                    # esta documentación + diagramas
├─ backend/
│  ├─ pyproject.toml  uv.lock
│  ├─ data/                 # aerosecure.db (en .gitignore)
│  └─ app/
│     ├─ main.py  config.py
│     ├─ api/  routers/ (alerts, incidents, catalog, dashboard, analytics, reports, demo, settings, stream)
│     │        schemas/  deps.py  errors.py
│     ├─ services/          # alert_service.py, incident_service.py, scoring_service.py, ...
│     ├─ repositories/      # alert_repo.py, incident_repo.py, timeline_repo.py, catalog_repo.py, settings_repo.py
│     ├─ domain/            # models.py, enums.py, state_machine.py, scoring.py, anomalies.py, errors.py
│     └─ infrastructure/    # db.py, event_bus.py, simulator.py, seed/
├─ frontend/
│  ├─ package.json  bun.lockb  vite.config.ts  tailwind.config.ts
│  ├─ public/evidence/      # imágenes ilustrativas sin rostros
│  └─ src/
│     ├─ main.tsx  App.tsx  router.tsx
│     ├─ presentation/  application/  domain/  infrastructure/
└─ start-demo.ps1           # levanta backend y frontend
```

## 4. Ejecución local

| Paso | Comando |
|---|---|
| Instalar dependencias del backend | `cd backend; uv sync` |
| Instalar dependencias del frontend | `cd frontend; bun install` |
| Levantar todo | `./start-demo.ps1`: abre `uv run uvicorn app.main:app --reload --port 8000` y `bun run dev` (Vite en `:5173`) |
| Abrir | `http://localhost:5173` (la API en `http://localhost:8000/docs`) |

Al arrancar, el backend crea la base de datos y la siembra si no existe, y lanza el simulador si está activo en la configuración.

## 5. Decisiones técnicas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| SSE para el tiempo real | WebSockets | La comunicación es unidireccional; SSE es más simple y reconecta solo |
| Bus de eventos en memoria | Redis o broker externo | Hay un solo proceso local y no tiene costo |
| SQLite y SQLModel | PostgreSQL | Cero infraestructura; la migración futura afecta solo a `repositories` e `infrastructure.db` |
| TanStack Query | Redux | El estado es mayoritariamente del servidor; invalidar por eventos es directo |
| Three.js puro con geometría generada por código | react-three-fiber o modelos GLTF | Menos dependencias y sin assets externos; la escena está aislada en un componente |
| Login simulado con `X-Actor-Id` | JWT u OAuth | La autenticación está fuera de alcance; se mantiene la trazabilidad del actor |
| Sin suite de pruebas | pytest o Playwright | Decisión del equipo (D10); la calidad se apoya en tipado, linters y el guion manual |
