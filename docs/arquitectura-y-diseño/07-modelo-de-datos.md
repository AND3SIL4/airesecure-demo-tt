# 07 · Modelo de datos

📊 Diagrama: [Modelo de datos (ERD)](../diagramas/07-modelo-datos/modelo-datos.html)

Base de datos **SQLite** en `backend/data/aerosecure.db`, con las tablas definidas como clases SQLModel en `app/domain/models.py`. Las fechas se guardan en **UTC (ISO 8601)**. Los enums se guardan como texto (`varchar`).

## 1. Tablas

### Catálogos

| Tabla | Propósito | Columnas clave |
|---|---|---|
| `zones` | Zonas de la Terminal 1 ficticia | `id`, `name`, `terminal`, `criticality` (1-3), `restricted`, geometría `geom_x/z/w/d/h` en metros para el mapa 3D y 2D |
| `sources` | Cámaras, sensores y fuentes lógicas | `id` (`CAM-T1-034`, `SEN-T1-005`, `MANUAL`, `ANALISIS`), `kind` (`camara`, `sensor`, `reporte_manual`, `analisis`), `zone_id` |
| `alert_types` | Tipos de alerta y su configuración | `code`, `default_severity`, `scenario_weight`, `confidence_threshold`, `recommendation`, `protocol_json` (lista de pasos) |
| `teams` | Equipos de respuesta | `id`, `name`, `specialty`, `specialized` (puede recibir escalamientos) |
| `users` | Perfiles simulados | `id`, `alias`, `role` (`operador`, `supervisor`) |

### Operación

| Tabla | Propósito | Notas |
|---|---|---|
| `alerts` | Alertas generadas | `origin`: `seed`, `simulador`, `escenario` o `manual`. `confidence` es nula en los reportes manuales. `evidence_key` = `type_code`; apunta a `frontend/public/evidence/<key>.svg`. `reported_by` solo aplica en los reportes manuales. `dismiss_comment` guarda el texto libre del descarte (obligatorio con el motivo "otro") |
| `incidents` | Incidentes confirmados | `alert_id` es **único** (relación 1 a 1 con su alerta). La severidad, la zona y el tipo se leen de la alerta (con JOIN) |

### Auditoría y configuración

| Tabla | Propósito | Notas |
|---|---|---|
| `timeline_events` | Bitácora de todas las acciones | Solo inserción. Referencia a `alert_id` y/o `incident_id`. `actor_id` nulo significa "Sistema" |
| `app_settings` | Configuración en clave-valor | Claves: `simulator.enabled`, `simulator.interval_seconds`, `thresholds.<type_code>` |

### Valores de `timeline_events.action`

`created`, `review`, `confirm`, `dismiss`, `comment`, `incident_created`, `assign`, `start`, `escalate`, `resolve`, `demo_reset`, `scenario_triggered`, `settings_updated`.

## 2. Índices

| Tabla | Índice | Uso |
|---|---|---|
| `alerts` | `(status, score DESC)` | Lista de alertas activas priorizadas |
| `alerts` | `(detected_at)` | Rangos de fechas, tendencias y anomalías |
| `alerts` | `(zone_id)`, `(type_code)` | Filtros |
| `incidents` | `(status)`, `(opened_at)` | Registro y KPIs |
| `timeline_events` | `(alert_id, created_at)`, `(incident_id, created_at)` | Timeline del detalle |

## 3. Datos de catálogo

### 3.1 Zonas: Aeropuerto Internacional Demo, Terminal 1

| id | Nombre | Criticidad | Restringida |
|---|---|:-:|:-:|
| `T1-HALL` | Hall principal | 2 | No |
| `T1-CHECKIN` | Check-in | 2 | No |
| `T1-SEGURIDAD` | Filtro de seguridad | 3 | No |
| `T1-MIGRACION` | Migración | 3 | No |
| `T1-EMBARQUE-A` | Sala de embarque A | 2 | No |
| `T1-PUERTAS` | Puertas 10-14 | 2 | No |
| `T1-EQUIPAJES` | Sala de equipajes | 3 | No |
| `T1-COMERCIAL` | Zona comercial | 1 | No |
| `T1-SERVICIO` | Puerta de servicio | 3 | Sí |
| `T1-PLATAFORMA` | Plataforma | 3 | Sí |

La geometría (posición y tamaño en metros) se define en la semilla para formar un plano coherente: la zona lado tierra (hall, check-in y zona comercial) queda al frente, el filtro de seguridad y migración en el centro, y las salas, puertas y plataforma al fondo.

### 3.2 Fuentes
- 15 cámaras `CAM-T1-001` a `CAM-T1-015`, con 1 o 2 por zona (asignación exacta en `specs/001-fundacion/data-model.md`; `CAM-T1-013` vigila la Puerta de servicio).
- 5 sensores de acceso `SEN-T1-001` a `SEN-T1-005`, en las zonas de seguridad, migración, servicio y plataforma.
- 2 fuentes lógicas: `MANUAL` (reporte de un operador) y `ANALISIS` (análisis de incidentes y patrones).

### 3.3 Equipos

| id | Nombre | Especialidad | Especializado |
|---|---|---|:-:|
| `seg-t1` | Seguridad T1 | Seguridad general | No |
| `patrulla` | Patrulla de plataforma | Plataforma | No |
| `operaciones` | Operaciones | Operaciones | No |
| `eod` | Unidad antiexplosivos (EOD) | Explosivos | Sí |
| `policia` | Policía aeroportuaria | Policial | Sí |
| `medico` | Servicios médicos | Atención médica | Sí |

### 3.4 Usuarios

| id | Alias | Rol |
|---|---|---|
| `op-01` | Operador 01 | operador |
| `op-02` | Operador 02 | operador |
| `sup-a` | Supervisor A | supervisor |

Los tipos de alerta, las severidades y los umbrales están en el doc 05 (§4).

## 4. Reglas de integridad

- Claves foráneas activas (`PRAGMA foreign_keys = ON`).
- `incidents.alert_id` es único: una alerta genera como máximo un incidente.
- `alerts.status = 'confirmada'` ⇔ existe un incidente con su `alert_id`. Lo garantiza el servicio, dentro de la transacción.
- `alerts.dismiss_reason` solo tiene valor si `status = 'descartada'`.
- `incidents.resolution_note` y `resolved_at` solo tienen valor si `status = 'resuelto'`.
- No hay borrados físicos, salvo con `demo/reset`, que recrea el archivo completo.

## 5. Evolución futura (fuera de la demo)

- Migración a PostgreSQL: se cambia la URL del engine y se añaden migraciones con Alembic.
- La tabla `evidence` almacenaría las capturas reales de las cámaras (hoy solo hay una `evidence_key` estática).
- Las tablas `users` y `roles` reales irían ligadas a un proveedor de identidad.
