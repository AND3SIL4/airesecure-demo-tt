# 10 · Datos simulados y simulador

Todos los datos son **ficticios**: ni nombres reales, ni rostros, ni datos personales.

## 1. Principio: datos relativos a "ahora"

La semilla se genera en cada `demo/reset` (y en el primer arranque) **a partir de la hora actual**. Así, la demo siempre muestra actividad de hoy, de las últimas horas y de los últimos 30 días, sin importar cuándo se presente. La generación usa una **semilla aleatoria fija** (`random.seed(2048)`), de modo que los datos tienen la misma forma en cada reinicio.

Módulo: `backend/app/infrastructure/seed/` (`catalogs.py`, `history.py`, `active.py`, `scenarios.py`, `texts.py`).

## 2. Catálogos

Las zonas, fuentes, tipos, equipos y usuarios están en el doc 07 §3 y en el doc 05 §4.

## 3. Histórico (últimos 30 días, hasta ayer a las 23:59)

| Parámetro | Valor |
|---|---|
| Alertas totales | ≈ 220 |
| Confirmadas, que pasan a incidente resuelto | ≈ 150 (≈ 68 %) |
| Descartadas (falsos positivos) | ≈ 70, con motivos repartidos |
| Distribución horaria | Picos entre las 06:00 y 09:00 y entre las 17:00 y 20:00; valle entre la 01:00 y las 05:00 |
| Tendencia | Ligero aumento en la última semana (≈ +15 %) para que el gráfico tenga historia |
| Severidad (de las confirmadas) | 8 % crítica, 22 % alta, 45 % media, 25 % baja |
| Zonas más frecuentes | Sala de embarque A, Hall principal, Filtro de seguridad, Sala de equipajes |
| Tiempo de respuesta | Entre 1 y 8 min (crítica: 1-3 min) |
| Tiempo de resolución | Entre 15 y 120 min; en los escalados, entre 45 y 180 min |
| Escalados | ≈ 10 % de los incidentes (EOD, policía o médico, según el tipo) |
| Actores | Se reparten entre Operador 01 y Operador 02 (≈ 90 %) y Supervisor A |
| Timeline | Cada registro tiene sus eventos completos (`created` → `review` → `confirm` → `incident_created` → `assign` → `start` → [`escalate`] → `resolve`) |

## 4. Hoy (desde las 00:00 hasta ahora)

| Elemento | Cantidad | Detalle |
|---|---|---|
| Incidentes resueltos hoy | 6 | Para el KPI "Resueltos hoy" y su variación frente a ayer |
| Alertas descartadas hoy | 3 (+3 de la anomalía = 6 en total) | Para la tasa de falsos positivos; las 3 de la anomalía (Sala de embarque A, última hora) también cuentan |
| Incidentes en curso | 3 | `INC` abierto (sin equipo, hace 20 min), en atención (Seguridad T1, hace 35 min) y escalado (Policía, hace 50 min) |
| **Alertas activas** | **12** | Ver la tabla siguiente |

### Alertas activas sembradas

| # | Tipo | Severidad | Estado | Zona | Fuente | Confianza | Hace |
|---|---|---|---|---|---|---|---|
| 1 | Equipaje abandonado | Crítica | nueva | Sala de equipajes | CAM-T1-012 | 0,94 | 3 min |
| 2 | Acceso a zona restringida | Crítica (elevada por zona restringida) | en_revision | Plataforma | SEN-T1-005 | 0,91 | 9 min |
| 3 | Concentración inusual de personas | Media | nueva | Sala de embarque A | CAM-T1-008 | 0,78 | 6 min |
| 4 | Concentración inusual de personas | Media | en_revision | Sala de embarque A | CAM-T1-009 | 0,72 | 18 min |
| 5 | Objeto inusual | Alta | nueva | Filtro de seguridad | CAM-T1-005 | 0,83 | 12 min |
| 6 | Comportamiento anómalo | Media | nueva | Migración | CAM-T1-006 | 0,69 | 22 min |
| 7 | Acceso a zona restringida | Alta | en_revision | Puerta de servicio | SEN-T1-004 | 0,76 | 27 min |
| 8 | Permanencia inusual | Baja | nueva | Zona comercial | CAM-T1-014 | 0,64 | 31 min |
| 9 | Permanencia inusual | Baja | nueva | Hall principal | CAM-T1-001 | 0,61 | 40 min |
| 10 | Objeto inusual | Alta | en_revision | Puertas 10-14 | CAM-T1-010 | 0,80 | 44 min |
| 11 | Incidente reportado por un operador | Media | nueva | Check-in | MANUAL | N/A | 15 min |
| 12 | Comportamiento anómalo | Media | nueva | Hall principal | CAM-T1-002 | 0,66 | 55 min |

Las alertas en `en_revision` tienen `reviewed_by` y su evento `review` en la timeline.

Las severidades de esta tabla son **fijas**. La elevación de un nivel por zona restringida (doc 05 §4.2) la aplica el simulador al generar eventos nuevos, no la semilla. Por eso la #7 (Puerta de servicio) se mantiene en Alta.

### Anomalía sembrada

En los últimos 60 minutos hay **5** alertas de "Concentración inusual" en la Sala de embarque A: las #3 y #4, más 3 descartadas. Con la regla del doc 05 §7 (referencia mínima de 1 alerta/h), el Resumen y Análisis muestran "Aumento inusual · Sala de embarque A" y "Aumento inusual · Concentración inusual de personas" con la variación que resulte del cálculo (≈ +400 % con los datos sembrados). La cifra "+65 %" del mockup era solo ilustrativa.

## 5. Textos de las alertas

Cada tipo tiene de 3 a 5 plantillas de descripción con variables `{zona}`, `{fuente}`, `{min}` y `{n}`. Ejemplos:

| Tipo | Plantilla |
|---|---|
| Equipaje abandonado | "Posible equipaje sin supervisión detectado en {zona} durante más de {min} min." |
| Objeto inusual | "Objeto no habitual detectado por {fuente} cerca del área de tránsito." |
| Acceso a zona restringida | "Apertura de acceso sin credencial válida registrada por {fuente}." |
| Comportamiento anómalo | "Patrón de movimiento atípico detectado en {zona}." |
| Concentración inusual | "Concentración de aproximadamente {n} personas, por encima del promedio de {zona}." |
| Permanencia inusual | "Permanencia prolongada en {zona} superior al umbral configurado." |

La **recomendación** y el **protocolo** (de 3 a 5 pasos) se toman de `alert_types` (doc 05). Ejemplo para "Equipaje abandonado":
1. Verificar visualmente con las cámaras cercanas.
2. Enviar a Seguridad T1 a verificar en sitio.
3. Acordonar el área si no se identifica al propietario en 5 min.
4. Escalar a la Unidad EOD si el objeto es sospechoso.

## 6. Evidencia visual

- Hay **ilustraciones SVG por tipo** en `frontend/public/evidence/<type_code>.svg`: el objeto o la escena en estilo plano, **sin personas identificables** (siluetas genéricas como mucho).
- Se muestran dentro del marco de cámara de `EvidenceViewer` (cabecera con la fuente y un timestamp superpuesto), con un recuadro de detección sobre el **objeto**.
- Siempre llevan la leyenda "Imagen ilustrativa · sin datos personales".
- `alerts.evidence_key` = `type_code`, de modo que `evidenceUrl` = `/evidence/<type_code>.svg`.

## 7. Simulador

| Aspecto | Comportamiento |
|---|---|
| Ejecución | Tarea `asyncio` iniciada en el `lifespan` de FastAPI; se detiene limpiamente al apagar el servidor |
| Configuración | `simulator.enabled` (por defecto `true`) y `simulator.interval_seconds` (por defecto 60). El intervalo real es aleatorio entre 0,75× y 1,5× el configurado |
| Generación | 1) Tipo según `scenario_weight`. 2) Zona compatible: el acceso restringido solo en Servicio o Plataforma, el equipaje en Equipajes, Hall, Check-in o Embarque. 3) Fuente de esa zona. 4) Confianza uniforme entre 0,50 y 0,98. 5) Severidad por defecto del tipo, +1 nivel si la zona es restringida |
| Compatibilidad de zonas | `acceso_restringido`: Puerta de servicio, Plataforma · `equipaje_abandonado`: Sala de equipajes, Hall, Check-in, Sala de embarque A · `objeto_inusual`: todas salvo Plataforma · `concentracion_personas`: Hall, Check-in, Filtro de seguridad, Migración, Sala de embarque A, Puertas 10-14 · `comportamiento_anomalo` y `permanencia_inusual`: todas las no restringidas · `reporte_operador`: nunca lo genera el simulador |
| Umbral | Si la confianza es menor que el umbral del tipo, se registra como "bajo umbral" (contador persistente `stats.below_threshold` en `app_settings`, visible en `/api/health`) y **no** crea alerta |
| Alerta | Se crea con `AlertService.create_from_event(...)` (`origin = simulador`, actor Sistema) y se publica `alert.created` |
| Cambios en caliente | `PUT /settings` reprograma la próxima ejecución sin reiniciar |
| Reinicio | `demo/reset` pausa el simulador, vuelve a sembrar los datos y lo reanuda si estaba activo |

## 8. Escenarios predefinidos

| ID | Nombre | Tipo | Severidad | Zona | Fuente | Confianza |
|---|---|---|---|---|---|---|
| E-1 | Equipaje abandonado en la sala de equipajes | equipaje_abandonado | crítica | T1-EQUIPAJES | CAM-T1-012 | 0,94 |
| E-2 | Intrusión en la plataforma | acceso_restringido | alta (crítica por zona restringida) | T1-PLATAFORMA | SEN-T1-005 | 0,88 |
| E-3 | Aglomeración en la sala de embarque | concentracion_personas | media | T1-EMBARQUE-A | CAM-T1-008 | 0,71 |
| E-4 | Permanencia prolongada en la zona comercial | permanencia_inusual | baja | T1-COMERCIAL | CAM-T1-014 | 0,62 |

Los escenarios **ignoran el umbral**: siempre crean la alerta, con `origin = escenario`.
