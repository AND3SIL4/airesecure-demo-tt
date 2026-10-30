# 08 · Especificación de la API

📊 Diagramas de secuencia:
- [Confirmar una alerta](../diagramas/08-secuencia-confirmar-alerta/secuencia-confirmar-alerta.html)
- [Alerta en tiempo real (SSE)](../diagramas/08-secuencia-tiempo-real/secuencia-tiempo-real.html)
- [Reiniciar la demo](../diagramas/08-secuencia-reinicio-demo/secuencia-reinicio-demo.html)

## 1. Convenciones

| Tema | Convención |
|---|---|
| URL base | `http://localhost:8000/api` (desde el frontend se usa `/api` vía el proxy de Vite) |
| Formato | JSON en UTF-8; propiedades en **camelCase**; fechas en ISO 8601 UTC (`2026-10-30T20:42:00Z`) |
| Actor | Cabecera **`X-Actor-Id`** obligatoria en `POST` y `PUT` (`op-01`, `op-02`, `sup-a`). Si falta o no existe: `401 ACTOR_REQUERIDO` |
| Paginación | `?page=1&pageSize=20` → `{ "items": [...], "total": 153, "page": 1, "pageSize": 20 }` |
| Orden | `?sort=score:desc` (campos permitidos por endpoint) |
| Documentación | OpenAPI automático en `/docs` y `/openapi.json` |

### Formato de error

```json
{ "error": { "code": "TRANSICION_INVALIDA", "message": "La alerta ALT-2048 ya fue confirmada por Operador 02 a las 15:44.", "details": { "currentStatus": "confirmada" } } }
```

| HTTP | `code` | Cuándo |
|---|---|---|
| 401 | `ACTOR_REQUERIDO` | Falta `X-Actor-Id` o no es válido |
| 403 | `SOLO_SUPERVISOR` | Endpoints de demo, configuración o reportes llamados con un actor de rol operador |
| 404 | `NO_ENCONTRADO` | El recurso no existe |
| 409 | `TRANSICION_INVALIDA` | La acción no está permitida en el estado actual |
| 422 | `VALIDACION` | Campos faltantes o inválidos (`details.fields`) |
| 422 | `EQUIPO_REQUERIDO` | Se intentó `start` sin un equipo asignado |
| 405 | `METODO_NO_PERMITIDO` | Método HTTP no soportado por la ruta |
| otros | `HTTP_<status>` | Cualquier otro error HTTP no contemplado arriba |
| 500 | `ERROR_INTERNO` | Error no controlado (mensaje genérico) |

## 2. DTOs principales

```ts
type Severity = 'critica' | 'alta' | 'media' | 'baja';
type AlertStatus = 'nueva' | 'en_revision' | 'confirmada' | 'descartada';
type IncidentStatus = 'abierto' | 'en_atencion' | 'escalado' | 'resuelto';

interface AlertSummary {
  id: string; type: { code: string; name: string };
  severity: Severity; status: AlertStatus;
  zone: { id: string; name: string };
  source: { id: string; kind: string; label: string };
  detectedAt: string; confidence: number | null; score: number;
  description: string; incidentId: string | null;
}

interface AlertDetail extends AlertSummary {
  scoreBreakdown: { severityWeight: number; confidence: number; zoneFactor: number; zoneCriticality: number; score: number };
  recommendation: string; protocol: string[];
  evidenceUrl: string; evidenceIsIllustrative: true;
  dismissReason: string | null; reviewedBy: UserRef | null;
  firstActionAt: string | null; closedAt: string | null;
  timeline: TimelineEvent[];
}

interface Incident {
  id: string; status: IncidentStatus;
  alert: AlertSummary;               // severidad, zona y tipo vienen de aquí
  team: TeamRef | null; escalatedTo: TeamRef | null;
  openedBy: UserRef; openedAt: string; startedAt: string | null;
  escalatedAt: string | null; resolvedAt: string | null;
  resolutionNote: string | null;
  responseSeconds: number | null; resolutionSeconds: number | null;
  timeline?: TimelineEvent[];        // solo en el detalle (incluye la de la alerta)
}

interface TimelineEvent {
  id: number; action: string; actor: UserRef | null;   // null = Sistema
  fromStatus: string | null; toStatus: string | null;
  comment: string | null; payload: Record<string, unknown> | null; createdAt: string;
}
```

## 3. Endpoints

### 3.1 Catálogos

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/users` | `UserRef[]` (para el login simulado) |
| GET | `/api/me` | Usuario del `X-Actor-Id` (obligatorio); 401 `ACTOR_REQUERIDO` si falta o no existe. Lo usa el front para validar el perfil guardado |
| GET | `/api/zones` | `Zone[]` con geometría y `riskLevel` actual (la severidad máxima activa o `normal`) |
| GET | `/api/teams` | `TeamRef[]` con `specialized` |
| GET | `/api/alert-types` | Tipos con severidad por defecto, umbral, recomendación y protocolo |
| GET | `/api/dismiss-reasons` | Catálogo de motivos de descarte |

### 3.2 Resumen

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/dashboard/summary` | `{ kpis: { activeAlerts, criticalAlerts, openIncidents, resolvedToday, avgResponseSecondsToday }, deltas: {...vsYesterday}, topAlerts: AlertSummary[6], zones: ZoneStatus[], byCategory7d: {type, count}[], trend24h: {hour, count}[], anomalies: Anomaly[] }` |

### 3.3 Alertas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/alerts` | Filtros: `status` (lista separada por comas; `activas` equivale a `nueva,en_revision`), `severity`, `zone`, `type`, `source`, `q`, `from`, `to`. Orden: `score`, `detectedAt` o `severity`. Paginado |
| GET | `/api/alerts/{id}` | `AlertDetail` |
| POST | `/api/alerts` | Reporte manual. Body: `{ typeCode, zoneId, severity, description }`. Responde `201 AlertDetail` |
| POST | `/api/alerts/{id}/actions` | Body según la acción (ver abajo). Responde `200 AlertDetail`, o `201 { alert, incident }` en `confirm` |

**Acciones sobre una alerta**

```json
{ "action": "review" }
{ "action": "confirm", "note": "Verificado en CAM-T1-034" }
{ "action": "dismiss", "reason": "movimiento_normal", "comment": "Grupo de pasajeros en tránsito" }
{ "action": "comment", "comment": "Se solicita apoyo de la cámara 035" }
```

### 3.4 Incidentes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/incidents` | Filtros: `status`, `severity`, `zone`, `type`, `q`, `from`, `to`. Orden: `openedAt`, `severity` o `responseSeconds`. Paginado |
| GET | `/api/incidents/{id}` | `Incident` con la timeline combinada |
| POST | `/api/incidents/{id}/actions` | Responde `200 Incident` |

```json
{ "action": "assign",   "teamId": "seg-t1", "comment": "Verificar con patrulla" }
{ "action": "start" }
{ "action": "escalate", "teamId": "eod", "reason": "Objeto no identificado, se requiere revisión EOD" }
{ "action": "resolve",  "note": "Equipaje de pasajero recuperado y verificado" }
{ "action": "comment",  "comment": "EOD en sitio" }
```

### 3.5 Análisis y reportes

| Método | Ruta | Parámetros y respuesta |
|---|---|---|
| GET | `/api/analytics/by-zone` | `?days=7\|14\|30` → `{ zoneId, zoneName, count }[]` |
| GET | `/api/analytics/by-type` | `?days=` → `{ typeCode, typeName, count }[]` |
| GET | `/api/analytics/trend` | `?days=` → `{ date, total, critica, alta, media, baja }[]` |
| GET | `/api/analytics/times` | `?days=` → `{ avgResponseSeconds, avgResolutionSeconds, byDay: [...] }` |
| GET | `/api/analytics/outcomes` | `?days=` → `{ confirmed, dismissed, confirmationRate, belowThreshold }` |
| GET | `/api/analytics/anomalies` | `Anomaly[]` = `{ scope: 'zone'\|'type', key, label, lastHour, hourlyMean, variationPct }` |
| GET | `/api/reports/incidents.csv` | Mismos filtros que `/incidents`. Devuelve `text/csv` en UTF-8 con BOM. **Solo supervisor** |

### 3.6 Configuración y demo (solo supervisor)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/settings` | `{ simulator: { enabled, intervalSeconds }, thresholds: { [typeCode]: number } }` |
| PUT | `/api/settings` | El mismo esquema (parcial). Valida intervalos de 15-300 s y umbrales de 0,50-0,99; emite `settings.updated` |
| GET | `/api/demo/scenarios` | `{ id, name, typeCode, severity, zoneId, confidence }[]` (E-1 a E-4) |
| POST | `/api/demo/scenarios/{id}/trigger` | Crea la alerta del escenario. Responde `201 AlertDetail` |
| POST | `/api/demo/reset` | Vuelve a sembrar los datos. Responde `200 { alerts, incidents, resetAt }` |

### 3.7 Tiempo real

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/stream` | `text/event-stream`. Un `heartbeat` cada 15 s |
| GET | `/api/health` | `{ status: "ok", simulator: {...}, db: "ok" }` |

**Eventos SSE**

| `event:` | `data:` | Efecto en el frontend |
|---|---|---|
| `alert.created` | `AlertSummary` | Invalida alertas, resumen y zonas; toast (persistente si es crítica) |
| `alert.updated` | `{ id, status, actor }` | Invalida la alerta, las listas y el resumen |
| `incident.created` | `{ id, alertId }` | Invalida incidentes y resumen |
| `incident.updated` | `{ id, status, actor }` | Invalida el incidente, las listas y el resumen |
| `settings.updated` | `Settings` | Invalida la configuración |
| `demo.reset` | `{ resetAt }` | Invalida **toda** la caché y navega al Resumen |
| `heartbeat` | `{ ts }` | Ninguno (mantiene viva la conexión) |

## 4. Mapa de casos de uso a endpoints

| UC | Endpoint |
|---|---|
| UC-01 | `GET /users`, `GET /me` |
| UC-02 | `GET /dashboard/summary` |
| UC-03 | `GET /alerts` + `GET /stream` |
| UC-04 | `GET /zones` + `GET /alerts?status=activas` |
| UC-05 | `GET /alerts/{id}` + `POST …/actions {review}` |
| UC-06 a UC-08 | `POST /alerts/{id}/actions` |
| UC-09 a UC-12 | `POST /incidents/{id}/actions` |
| UC-13 | `POST /alerts` |
| UC-14, UC-15 | `GET /incidents`, `GET /incidents/{id}` |
| UC-16 | `GET /analytics/*` |
| UC-17 | `GET /reports/incidents.csv` |
| UC-18 | `GET/PUT /settings` |
| UC-19 | `POST /demo/reset`, `POST /demo/scenarios/{id}/trigger` |
| UC-20, UC-21 | Internos (simulador, `ScoringService` y `anomalies`) → `alert.created` |
