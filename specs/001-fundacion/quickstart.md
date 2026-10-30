# Quickstart y validación manual: 001-fundacion

> Sin pruebas automatizadas (constitución VIII). Esta guía es la verificación manual de la feature.

## Prerrequisitos
- Windows con PowerShell 5.1 o superior, **uv** y **Bun** instalados (Node.js no es necesario).
- Puertos 8000 y 5173 libres.

## Arranque
```powershell
./start-demo.ps1
```
Esperado: se instalan las dependencias si faltan, se abren dos procesos (API y web), el script espera a `/api/health` y abre `http://localhost:5173`.

## Verificaciones

| # | Paso | Resultado esperado | Ref. |
|---|---|---|---|
| 1 | Borrar `backend/data/aerosecure.db` y ejecutar `./start-demo.ps1` | Arranca en < 60 s y se crea la base de datos | SC-001, FR-001/002 |
| 2 | `curl http://localhost:8000/api/health` | `status: ok`, `db: ok` | FR-005 |
| 3 | `curl http://localhost:8000/api/zones` | 10 zonas con `riskLevel: "normal"` y geometría | FR-006, SC-002 |
| 4 | `/api/users`, `/api/teams`, `/api/alert-types`, `/api/dismiss-reasons` | 3 usuarios, 6 equipos (3 especializados), 7 tipos con protocolo y 5 motivos | FR-006, SC-002 |
| 5 | `curl http://localhost:8000/api/me` (sin cabecera) | 401 `ACTOR_REQUERIDO` en el formato común | FR-008/009 |
| 6 | `curl -H "X-Actor-Id: op-01" http://localhost:8000/api/me` | 200 con Operador 01 | FR-009 |
| 7 | `curl http://localhost:8000/api/no-existe` | 404 `NO_ENCONTRADO` | FR-008 |
| 8 | Reiniciar el script con la base de datos existente; `GET /api/zones` | Siguen siendo 10 (sin duplicados) | FR-003 |
| 9 | Abrir `http://localhost:8000/docs` | Documentación interactiva | FR-010 |
| 10 | Abrir la web sin perfil | Redirige a `/login`, con el banner visible | FR-013, SC-004 |
| 11 | Elegir Operador 01 | Llega al Resumen (placeholder) en ≤ 2 clics; el alias aparece en el sidebar | SC-003 |
| 12 | Recargar (F5) | Sigue con Operador 01 | FR-012 |
| 13 | Revisar el menú como operador y abrir `/configuracion` a mano | Sin Reportes ni Configuración; la redirección muestra un toast | FR-016/019, SC-005 |
| 14 | Cambiar a Supervisor A | El menú incluye Reportes y Configuración y ambos abren su placeholder | SC-005 |
| 15 | Topbar | Aeropuerto, terminal y hora de Bogotá correcta; los botones futuros aparecen deshabilitados con tooltip | FR-017 |
| 16 | Navegar todo con Tab, Shift+Tab y Enter | Foco visible y todo alcanzable | FR-023, SC-007 |
| 17 | Redimensionar a 900 px | Sidebar colapsado a iconos y utilizable | FR-024 |
| 18 | Detener la API y recargar `/login` (tras borrar el perfil) | Estado de error con "Reintentar" | FR-025 |
| 19 | Poner `localStorage['aerosecure.actor'] = 'x-99'` y recargar | Vuelve a `/login` | FR-013 |
| 20 | `cd backend; uv run ruff check .` · `cd frontend; bun run lint; bunx tsc --noEmit` | Sin errores | SC-008 |

Checklist del doc 11 §3 que aplica: Generales (arranque, banner, sin datos personales, tablet, severidad con icono y texto) y HU-01/02.
