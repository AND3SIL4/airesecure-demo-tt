# Data Model: 001-fundacion

En esta feature se crean **todas las tablas de catálogos y de configuración**. Las tablas `alerts`, `incidents` y `timeline_events` se crean en la feature 002, para que su forma coincida con la lógica que las usa.

La fuente es `docs/arquitectura-y-diseño/07-modelo-de-datos.md` (§1, §3) y `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§4). Los modelos SQLModel van en `backend/app/domain/models.py` y los enums en `backend/app/domain/enums.py`.

## Enums (domain/enums.py)

| Enum | Valores |
|---|---|
| `Severity` | `critica`, `alta`, `media`, `baja` |
| `Role` | `operador`, `supervisor` |
| `SourceKind` | `camara`, `sensor`, `reporte_manual`, `analisis` |
| `RiskLevel` | `critica`, `alta`, `media`, `baja`, `normal` |
| `DismissReason` | `pertenencia_personal`, `movimiento_normal`, `falla_camara`, `personal_autorizado`, `otro` |

También se definen en el dominio (no se persisten): `SEVERITY_WEIGHT`, `SEVERITY_ORDER`, `ZONE_FACTOR` (doc 05 §4.1 y §5) y `DISMISS_REASON_LABELS`.

## Tablas

### zones
| Campo | Tipo | Reglas |
|---|---|---|
| id | str(16) PK | p. ej. `T1-HALL` |
| name | str(80) | no vacío |
| terminal | str(8) | `T1` |
| criticality | int | 1..3 |
| restricted | bool | |
| geom_x, geom_z | float | centro en metros |
| geom_w, geom_d, geom_h | float | ancho (X), fondo (Z) y alto, > 0 |

### sources
| Campo | Tipo | Reglas |
|---|---|---|
| id | str(16) PK | `CAM-T1-001`, `SEN-T1-001`, `MANUAL`, `ANALISIS` |
| kind | `SourceKind` | |
| label | str(80) | |
| zone_id | str(16) FK → zones.id, **nullable** | nulo solo para las fuentes lógicas (`MANUAL`, `ANALISIS`) |

### alert_types
| Campo | Tipo | Reglas |
|---|---|---|
| code | str(32) PK | |
| name | str(80) | |
| default_severity | `Severity` nullable | nulo en `reporte_operador` (la elige quien reporta) |
| scenario_weight | int | ≥ 0 |
| confidence_threshold | float nullable | 0.50..0.99; nulo en `reporte_operador` |
| recommendation | text | |
| protocol_json | text | lista JSON de 3-5 pasos |

### teams
| Campo | Tipo |
|---|---|
| id | str(16) PK |
| name | str(80) |
| specialty | str(80) |
| specialized | bool |

### users
| Campo | Tipo |
|---|---|
| id | str(16) PK |
| alias | str(40) |
| role | `Role` |

### app_settings
| Campo | Tipo |
|---|---|
| key | str(64) PK |
| value_json | text |
| updated_at | datetime (UTC) |

## Datos semilla (infrastructure/seed/catalogs.py)

### Zonas: losa de 120 × 80 m centrada en (0,0); +Z apunta hacia la plataforma

| id | name | crit. | restr. | x | z | w | d | h |
|---|---|:-:|:-:|---:|---:|---:|---:|---:|
| T1-CHECKIN | Check-in | 2 | No | -40 | -30 | 30 | 16 | 5 |
| T1-HALL | Hall principal | 2 | No | 0 | -30 | 40 | 16 | 6 |
| T1-COMERCIAL | Zona comercial | 1 | No | 40 | -30 | 30 | 16 | 4 |
| T1-EQUIPAJES | Sala de equipajes | 3 | No | -52 | -5 | 16 | 30 | 4 |
| T1-SEGURIDAD | Filtro de seguridad | 3 | No | -20 | -10 | 30 | 14 | 4 |
| T1-MIGRACION | Migración | 3 | No | 20 | -10 | 30 | 14 | 4 |
| T1-SERVICIO | Puerta de servicio | 3 | **Sí** | 52 | -5 | 16 | 20 | 3 |
| T1-EMBARQUE-A | Sala de embarque A | 2 | No | -22 | 12 | 36 | 18 | 5 |
| T1-PUERTAS | Puertas 10-14 | 2 | No | 25 | 12 | 36 | 18 | 5 |
| T1-PLATAFORMA | Plataforma | 3 | **Sí** | 0 | 32 | 110 | 14 | 0.5 |

### Fuentes
| id | kind | zona |
|---|---|---|
| CAM-T1-001, CAM-T1-002 | camara | T1-HALL |
| CAM-T1-003 | camara | T1-CHECKIN |
| CAM-T1-004, CAM-T1-005 | camara | T1-SEGURIDAD |
| CAM-T1-006, CAM-T1-007 | camara | T1-MIGRACION |
| CAM-T1-008, CAM-T1-009 | camara | T1-EMBARQUE-A |
| CAM-T1-010, CAM-T1-011 | camara | T1-PUERTAS |
| CAM-T1-012 | camara | T1-EQUIPAJES |
| CAM-T1-013 | camara | T1-SERVICIO |
| CAM-T1-014 | camara | T1-COMERCIAL |
| CAM-T1-015 | camara | T1-PLATAFORMA |
| SEN-T1-001 | sensor | T1-SEGURIDAD |
| SEN-T1-002 | sensor | T1-MIGRACION |
| SEN-T1-003, SEN-T1-004 | sensor | T1-SERVICIO |
| SEN-T1-005 | sensor | T1-PLATAFORMA |
| MANUAL | reporte_manual | — |
| ANALISIS | analisis | — |

Label de cada fuente: "Cámara CAM-T1-001", "Sensor de acceso SEN-T1-001", "Reporte de operador", "Análisis de patrones".

### Tipos de alerta (doc 05 §4.2) con recomendación y protocolo
| code | recomendación | protocolo (pasos) |
|---|---|---|
| equipaje_abandonado | Verificar visualmente y activar el protocolo de revisión de equipaje. | Verificar con las cámaras cercanas · Enviar a Seguridad T1 a verificar en sitio · Acordonar el área si no aparece el propietario en 5 min · Escalar a la Unidad EOD si el objeto es sospechoso |
| objeto_inusual | Confirmar la naturaleza del objeto con una cámara cercana antes de intervenir. | Revisar el ángulo alterno de la cámara · Enviar a una patrulla a verificar · Registrar la descripción del objeto · Escalar si no es identificable |
| acceso_restringido | Verificar la credencial y la presencia de personal autorizado en el acceso. | Consultar el registro del sensor · Revisar la cámara del acceso · Enviar a la patrulla de plataforma · Escalar a la Policía aeroportuaria si no hay autorización |
| comportamiento_anomalo | Observar la evolución del patrón antes de actuar; evitar conclusiones prematuras. | Seguir con las cámaras durante 2 min · Informar a Seguridad T1 de la zona · Registrar observaciones |
| concentracion_personas | Evaluar el flujo y coordinar con Operaciones para redistribuir. | Verificar la ocupación en la cámara · Coordinar con Operaciones · Habilitar filas o puertas alternas · Monitorear 10 min |
| permanencia_inusual | Confirmar si se trata de un pasajero en espera legítima. | Revisar el tiempo de permanencia · Enviar a personal de atención si persiste · Registrar el resultado |
| reporte_operador | Validar la información reportada y asignar al equipo adecuado. | Confirmar los detalles con quien reporta · Revisar las cámaras de la zona · Asignar el equipo |

### Equipos, usuarios y configuración
- Equipos y usuarios: exactamente los del doc 07 §3.3 y §3.4.
- `app_settings`: `simulator.enabled` = `true`, `simulator.interval_seconds` = `60` y `thresholds.<code>` = el umbral de cada tipo con umbral.

## Reglas de validación e integridad
- `PRAGMA foreign_keys = ON` en cada conexión.
- Siembra por `merge` (idempotente). Los valores de `app_settings` **no** se sobrescriben si ya existen, para conservar los cambios hechos en la feature 008.
- Sin borrados en esta feature.
