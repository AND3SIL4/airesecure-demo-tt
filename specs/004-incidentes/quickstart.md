# Quickstart y validación manual: 004-incidentes

> Sin pruebas automatizadas. Borra `backend/data/aerosecure.db` antes de arrancar para regenerar el histórico. Para una prueba controlada, desactiva el simulador (`simulator.enabled = false` en `app_settings`).

| # | Paso | Esperado | Ref. |
|---|---|---|---|
| 1 | `GET /api/incidents?pageSize=1` | `total` ≈ 160 (≈ 150 del histórico, 6 resueltos hoy y 3 en curso) | FR-008 |
| 2 | `GET /api/incidents?status=en_curso` | 3 (abierto, en_atencion con seg-t1, escalado a policia) | US4-3 |
| 3 | Con todos los incidentes, calcular el % de escalados y los tiempos | ≈ 10 % escalados; respuesta de 1-8 min (críticas 1-3); resolución de 15-120 min (escalados 45-180) | SC-005 |
| 4 | `GET /api/alerts?status=nueva,en_revision,confirmada,descartada&pageSize=100&sort=detectedAt:asc` (varias páginas) | IDs crecientes con la fecha | US4-4 |
| 5 | `GET /api/incidents/{id}` de uno histórico escalado | Timeline: created → review → confirm → incident_created → assign → start → escalate → resolve | SC-004 |
| 6 | `POST …/actions {start}` sobre el abierto sin equipo | 422 `EQUIPO_REQUERIDO` | FR-002 |
| 7 | assign seg-t1 → start → escalate `{teamId: seg-t1}` | Escalar a un no especializado → 422; con `eod` y un motivo válido → escalado y team = eod | FR-001/003 |
| 8 | resolve con una nota corta / válida | 422 / 200 resuelto con `resolutionSeconds` | FR-004 |
| 9 | Repetir resolve | 409 legible | FR-002 |
| 10 | Confirmar una alerta nueva | Incidente nuevo con `responseSeconds` ya calculado | R2 |
| 11 | `GET /api/incidents?sort=responseSeconds:desc` | El primero tiene el mayor tiempo de respuesta | US2-3 |
| 12 | UI /incidentes: presets Hoy / 7 / 30 días, filtros y recarga | Totales coherentes; filtros persistentes | US2 |
| 13 | UI: detalle del incidente abierto → Atender deshabilitado con tooltip; Asignar → Atender → Escalar (diálogo) → Resolver (diálogo) | Estados y avisos correctos; timeline actualizada; foco al estado tras resolver | US1 |
| 14 | Dos pestañas: resolver en una | La otra se actualiza en ≤ 2 s; el contador del menú baja | US1-9, SC-006 |
| 15 | "Ver incidente" desde una alerta confirmada | Abre el detalle real | US3-4 |
| 16 | /incidentes/INC-9999 | Estado de error "no existe" | US3-3 |
| 17 | Linters: ruff, eslint, `tsc` y build | Sin errores | FR-014 |

Checklist del doc 11 §3: HU-16 a HU-21.
