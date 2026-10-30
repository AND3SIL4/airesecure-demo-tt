# Referencia condensada del dominio

## Transiciones de la alerta
| action | desde | hacia | requisitos | confirmación UI |
|---|---|---|---|---|
| review | nueva | en_revision | actor (automático al abrir) | no |
| confirm | nueva, en_revision | confirmada (+ INC abierto) | nota opcional ≤ 500 | sí |
| dismiss | nueva, en_revision | descartada | reason ∈ catálogo; `otro` exige comment ≥ 10 | sí |
| comment | cualquiera | — | 3-500 caracteres | no |

## Transiciones del incidente
| action | desde | hacia | requisitos | confirmación UI |
|---|---|---|---|---|
| assign | abierto, en_atencion, escalado | — | teamId válido | no |
| start | abierto, escalado | en_atencion | equipo asignado | no |
| escalate | abierto, en_atencion | escalado | teamId specialized + reason ≥ 10 | sí |
| resolve | en_atencion, escalado | resuelto | note ≥ 10 | sí |
| comment | cualquiera | — | 3-500 caracteres | no |

## Severidad
| código | etiqueta | w_sev | color | icono lucide | orden |
|---|---|---|---|---|---|
| critica | Crítica | 1.00 | #DC2626 | octagon-alert | 4 |
| alta | Alta | 0.75 | #EA580C | triangle-alert | 3 |
| media | Media | 0.50 | #D97706 | circle-alert | 2 |
| baja | Baja | 0.25 | #475569 | info | 1 |

`f_zona`: criticidad 1 → 0.60 · 2 → 0.80 · 3 → 1.00

## Tipos de alerta
| code | nombre | severidad por defecto | umbral | peso en el simulador |
|---|---|---|---|---|
| equipaje_abandonado | Equipaje abandonado | critica | 0.80 | 1 |
| objeto_inusual | Objeto inusual | alta | 0.75 | 2 |
| acceso_restringido | Acceso a zona restringida | alta | 0.70 | 2 |
| comportamiento_anomalo | Comportamiento anómalo | media | 0.65 | 3 |
| concentracion_personas | Concentración inusual de personas | media | 0.60 | 3 |
| permanencia_inusual | Permanencia inusual | baja | 0.60 | 4 |
| reporte_operador | Incidente reportado por un operador | (la elige quien reporta) | N/A | 0 |

La severidad sube +1 nivel si la zona es `restricted`.

## Motivos de descarte
`pertenencia_personal` · `movimiento_normal` · `falla_camara` · `personal_autorizado` · `otro`

## Catálogos
- Zonas: T1-HALL(2) · T1-CHECKIN(2) · T1-SEGURIDAD(3) · T1-MIGRACION(3) · T1-EMBARQUE-A(2) · T1-PUERTAS(2) · T1-EQUIPAJES(3) · T1-COMERCIAL(1) · T1-SERVICIO(3, restringida) · T1-PLATAFORMA(3, restringida)
- Equipos: seg-t1 · patrulla · operaciones · eod* · policia* · medico* (* = specialized)
- Usuarios: op-01 Operador 01 · op-02 Operador 02 · sup-a Supervisor A (supervisor)

## Métricas
- Respuesta = `first_action_at − detected_at`; resolución = `resolved_at − detected_at`.
- Alertas activas = nueva + en_revision; incidentes en curso = abierto + en_atencion + escalado.
- Tasa de confirmación = confirmadas / (confirmadas + descartadas).
- Variación frente a ayer: hoy de 00:00 a ahora, comparado con ayer de 00:00 a la misma hora.

## Anomalías
Por zona y por tipo: conteo de los últimos 60 min comparado con la media horaria de 7 días; hay anomalía si `conteo ≥ 3` y `conteo ≥ 1.5 × media`; variación = `(conteo/media − 1) × 100`.

## Eventos SSE
alert.created · alert.updated · incident.created · incident.updated · settings.updated · demo.reset · heartbeat
