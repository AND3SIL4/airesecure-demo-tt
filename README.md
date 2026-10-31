# AeroSecure AI · Demo MVP

> **Seguridad aeroportuaria inteligente.** *De los datos a las decisiones, para un aeropuerto más seguro.*
> La IA prioriza las alertas; **la decisión siempre es humana**.

Demo local de un centro de monitoreo para un aeropuerto ficticio ("Aeropuerto Internacional Demo · Terminal 1"). Incluye alertas priorizadas por un score explicable, la gestión de incidentes con trazabilidad completa, un mapa 3D de la terminal, análisis de tendencias, exportación CSV y un simulador de eventos en tiempo real.

> ⚠️ **Modo demostración**: las detecciones son simuladas y se basan en reglas. No hay cámaras, sensores, modelos de IA reales ni datos personales.

## Requisitos

| Herramienta | Versión | Uso |
|---|---|---|
| [uv](https://docs.astral.sh/uv/) | 0.4 o superior | Backend: descarga Python 3.12 y las dependencias |
| [Bun](https://bun.sh/) | 1.1 o superior | Frontend: dependencias y servidor de desarrollo (no hace falta Node.js) |
| Windows 11 + PowerShell | — | Script de arranque `start-demo.ps1` |
| Chrome o Edge actualizados | — | Navegador de la demo (WebGL para el mapa 3D) |

## Arranque rápido

```powershell
./start-demo.ps1
```

El script:
1. Comprueba que `uv` y `bun` estén instalados y que los puertos estén libres.
2. Instala las dependencias si faltan.
3. Abre dos ventanas: la API en `:8000` y la web en `:5173`.
4. Abre el navegador cuando la API responde.

- Web: <http://localhost:5173>
- API y documentación interactiva: <http://localhost:8000/docs>

Para detener la demo, cierra las ventanas "AeroSecure AI - API" y "AeroSecure AI - Web".

### Arranque manual

```powershell
cd backend;  uv sync;     uv run uvicorn app.main:app --reload --port 8000
cd frontend; bun install; bun run dev
```

La base de datos SQLite (`backend/data/aerosecure.db`) se crea y se siembra sola en el primer arranque. Los datos son relativos a la hora actual: 30 días de histórico, la actividad de hoy, 12 alertas activas y una anomalía.

## Perfiles (acceso simulado, sin contraseña)

| Perfil | Rol | Puede |
|---|---|---|
| Operador 01 / Operador 02 | operador | Monitorear, revisar, confirmar o descartar alertas, gestionar incidentes y reportar eventos |
| Supervisor A | supervisor | Todo lo anterior, más Reportes (CSV) y Configuración (simulador, escenarios, umbrales y reinicio) |

## Preparar una presentación

1. Arranca la demo y entra como **Supervisor A**.
2. En **Configuración**, pulsa **Reiniciar demo** (escribe `REINICIAR` para confirmar) y **apaga el simulador**, para que la presentación sea controlada.
3. Cambia de perfil a **Operador 01**. En otra pestaña con Supervisor A, usa **Configuración → Escenarios → Disparar E-1** en el momento del guion.

Guion completo (≈ 7 min) y checklist de aceptación: [`docs/arquitectura-y-diseño/11-guion-demo-y-aceptacion.md`](docs/arquitectura-y-diseño/11-guion-demo-y-aceptacion.md).

## Qué incluye

| Vista | Contenido |
|---|---|
| Resumen | KPIs con la variación frente a ayer, alertas prioritarias, mini-mapa, incidentes por tipo, tendencia de 24 h y anomalías |
| Alertas | Lista priorizada con filtros en la URL; detalle con evidencia ilustrativa, desglose del score, protocolo e historial; confirmar, descartar y comentar |
| Incidentes | Registro con filtros y fechas; detalle con asignar, atender, escalar a equipos especializados y resolver |
| Mapa | Maqueta 3D (Three.js) con zonas por riesgo y marcadores; alternativa 2D sin WebGL |
| Análisis | Por zona, por tipo, evolución por severidad, confirmadas frente a falsos positivos, tiempos y anomalías (7, 14 o 30 días) |
| Reportes | Vista previa y descarga CSV (solo supervisor) |
| Configuración | Simulador, escenarios E-1 a E-4, umbrales y reinicio (solo supervisor) |

Todo se actualiza en vivo (SSE): avisos, contadores, campana de notificaciones e indicador "En vivo".

## Stack y arquitectura

- **Backend**: Python 3.12, FastAPI, SQLModel y SQLite (uv). Capas `api → services → repositories → domain`, más `infrastructure` (db, bus SSE, simulador, siembra).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router, Recharts y Three.js (Bun). Capas `presentation → application → domain`, más `infrastructure` (HTTP y SSE).
- **Sin pruebas automatizadas**, por decisión del proyecto: la calidad se apoya en el tipado, `ruff`, `eslint`, `tsc` y la verificación manual.

```powershell
cd backend;  uv run ruff check . ; uv run ruff format --check .
cd frontend; bun run lint ; bunx tsc --noEmit ; bun run build
```

## Documentación

- Índice: [`docs/README.md`](docs/README.md) (visión, casos de uso, requisitos, flujos, dominio, arquitectura, datos, API, UI/UX, simulador, guion y Spec Kit).
- Constitución del proyecto: [`.specify/memory/constitution.md`](.specify/memory/constitution.md).
- Especificaciones por feature (Spec Kit): [`specs/`](specs/) (`001-fundacion` … `009-pulido-demo`).
- Guía para Claude Code: [`CLAUDE.md`](CLAUDE.md).

## Solución de problemas

| Síntoma | Solución |
|---|---|
| "No se encontró uv/bun" | Instala la herramienta y abre una nueva terminal |
| "El puerto 8000/5173 ya está en uso" | Cierra la instancia anterior (`Get-NetTCPConnection -LocalPort 8000,5173`) |
| La página carga sin datos | Revisa la ventana de la API; abre <http://localhost:8000/api/health> |
| "Reconectando…" permanente | Recarga la página; verifica que la API esté arriba |
| Datos "viejos" o de otro día | Configuración → Reiniciar demo |
| El mapa aparece en 2D | Activa la aceleración por hardware del navegador |
| La primera visita a una vista tarda | Es normal en desarrollo: Vite compila la vista la primera vez |
