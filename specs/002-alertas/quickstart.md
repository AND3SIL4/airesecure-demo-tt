# Quickstart y validación manual: 002-alertas

> Sin pruebas automatizadas. Prerrequisitos y arranque iguales que en la feature 001 (`./start-demo.ps1`). Para sembrar las alertas de nuevo, borra `backend/data/aerosecure.db` antes de arrancar.

## API (con `X-Actor-Id`)
| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | `GET /api/alerts` | `total` 12; el primero es equipaje abandonado (score 94); orden por score descendente | FR-010/012, SC-001 |
| 2 | `GET /api/alerts?status=descartada` | 6 (3 de hoy + 3 de la anomalía) | FR-010 |
| 3 | `GET /api/alerts?severity=critica&zone=T1-PLATAFORMA` | 1 (#2, en revisión) | FR-012 |
| 4 | `GET /api/alerts?q=equipaje` | Coincidencias por la descripción | FR-012 |
| 5 | `GET /api/alerts/{id}` de cualquiera | El `score` es igual a `round(100 × severityWeight × confidence × zoneFactor)` | FR-006, SC-005 |
| 6 | `POST …/actions {review}` sobre una nueva y repetirlo | Primero 200 `en_revision`; luego 409 | FR-002 |
| 7 | `POST …/actions {confirm}` sobre una en revisión | 201 con `incident.id` INC-0401; timeline con `confirm` + `incident_created` | FR-004/008 |
| 8 | Repetir `confirm` | 409 "ya fue confirmada por … a las HH:MM" | SC-004 |
| 9 | `POST …/actions {dismiss}` sin `reason` | 422 en español | FR-005/021 |
| 10 | `dismiss` con `reason: otro` y `comment: "corto"` | 422 | FR-005 |
| 11 | `confirm` sobre una **nueva** | Timeline: `review` implícito y luego `confirm` | FR-003 |
| 12 | `POST /api/alerts` manual válido | 201, `confidence: null`, `reportedBy` = actor | FR-015 |
| 13 | `GET /api/zones` | T1-EQUIPAJES `critica`, T1-PLATAFORMA `critica`, T1-COMERCIAL `baja` (con la semilla todas las zonas tienen alertas activas; para ver `normal`, descarta las activas de una zona) | FR-014 |
| 14 | Reiniciar el backend (sin borrar la base) | Las alertas no se duplican | FR-011 |

## UI
| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 15 | Abrir /alertas | Tabla priorizada, filtros vacíos salvo "Activas" | US1 |
| 16 | Filtrar por Crítica y recargar | Persiste en la URL y en los chips | SC-006 |
| 17 | Filtro sin resultados | EmptyState con "Limpiar filtros" | US1-5 |
| 18 | Navegar con ↑/↓ + Enter | Abre el detalle | US1-6 |
| 19 | Abrir una alerta nueva | Pasa a "En revisión"; la timeline muestra al actor; al reabrir no se duplica | US2-1 |
| 20 | Revisar el detalle | Evidencia ilustrativa sin personas; desglose; protocolo; plano con la zona resaltada | US2 |
| 21 | Confirmar con nota | Diálogo; aviso con INC; enlace "Ver incidente" | US3-1/2, SC-002 |
| 22 | Falso positivo sin motivo, o "Otro" corto | Error en línea; no se envía | US3-3/4 |
| 23 | Falso positivo válido | Estado Descartada con motivo y actor | US3-5 |
| 24 | Cancelar el diálogo | Sin cambios | US3-6 |
| 25 | Dos pestañas: confirmar en una y luego en la otra | Mensaje 409 legible y la vista se refresca | US3-8 |
| 26 | Comentar | Aparece en la timeline | US3-9 |
| 27 | Topbar → Reportar evento | Modal con validación; tras el éxito, lista con la fila resaltada | US4 |
| 28 | /alertas/ALT-9999 | Estado de error "no existe" | Edge |
| 29 | Linters: ruff, eslint, `tsc --noEmit`, build | Sin errores | FR-023 |

Checklist del doc 11 §3 que aplica: HU-04, HU-06 y HU-10 a HU-15, y la regla de dominio "acción sobre estado final → mensaje 409 legible" y "el score coincide con su desglose".
