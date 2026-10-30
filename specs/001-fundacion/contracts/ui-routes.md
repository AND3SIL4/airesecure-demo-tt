# Contrato de la UI: rutas y shell (001-fundacion)

Fuente: `docs/arquitectura-y-diseño/09-ui-ux.md` §1, §2 y §3.1.

| Ruta | Guardia | Contenido en 001 |
|---|---|---|
| `/login` | ninguna (si ya hay perfil válido → `/`) | Selector de perfil con los estados de carga, error y vacío |
| `/` | RequireActor | Placeholder "Resumen · Disponible en una próxima versión" |
| `/alertas`, `/alertas/:id` | RequireActor | Placeholder |
| `/incidentes`, `/incidentes/:id` | RequireActor | Placeholder |
| `/mapa` | RequireActor | Placeholder |
| `/analisis` | RequireActor | Placeholder |
| `/reportes` | RequireActor + RequireSupervisor | Placeholder (un operador → `/` con un toast "Esta sección es solo para supervisores") |
| `/configuracion` | RequireActor + RequireSupervisor | Placeholder (ídem) |
| `*` | — | Página "No encontrado" con un enlace al Resumen |

## Shell
- **DemoBanner** fijo arriba en todas las rutas, incluida `/login`.
- **Sidebar**:
  - Elementos: logo; Resumen, Alertas, Incidentes, Mapa y Análisis (+ Reportes y Configuración solo para el supervisor).
  - Un enlace activo resaltado y la tarjeta del perfil con "Cambiar perfil".
  - En < 1024 px se colapsa a iconos (72 px), con tooltips.
- **Topbar**:
  - Título de la vista, "Aeropuerto Internacional Demo · Terminal 1" y reloj `dd MMM yyyy HH:mm` (America/Bogota).
  - Botones deshabilitados con el tooltip "Disponible en una próxima versión": "Críticas (N)", "Reportar evento", campana e indicador "En vivo".
- **Toaster** abajo a la derecha (`aria-live`).

## Persistencia del perfil
`localStorage['aerosecure.actor'] = "<userId>"`. El perfil se valida con `GET /api/me`; si responde `ACTOR_REQUERIDO`, se borra y se redirige a `/login`. El selector lista los perfiles con `GET /users`.
