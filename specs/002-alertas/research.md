# Research: 002-alertas

Se reutiliza todo lo decidido en `specs/001-fundacion/research.md`; aquí solo se resuelven las incógnitas nuevas.

## R1. Máquina de estados como funciones puras
- **Decision**: `domain/state_machine.py` define `ALERT_TRANSITIONS: dict[AlertAction, set[AlertStatus]]` (los estados de origen permitidos) y `next_alert_status(current, action) -> AlertStatus`. Para las acciones no permitidas lanza `DomainError("TRANSICION_INVALIDA", …)`. `comment` devuelve el mismo estado. La revisión implícita la decide `AlertService` preguntando a `needs_implicit_review(current, action)`.
- **Rationale**: queda testeable a mano y es reutilizable por el incidente (feature 004); `services` no contiene tablas de transición.
- **Alternatives considered**: una librería de FSM (dependencia extra innecesaria).

## R2. Score explicable
- **Decision**: `domain/scoring.py::compute_score(severity, confidence | None, zone_criticality) -> ScoreBreakdown` (dataclass con `severity_weight`, `confidence`, `zone_factor`, `zone_criticality`, `score`). Si la confianza es `None` (reporte manual), se usa 1.0 y `manual=True`. Se guarda como JSON en `alerts.score_breakdown_json` y la API lo expone como `scoreBreakdown`.
- **Rationale**: es la fórmula del doc 05 §5, en un único lugar, lista para que la reutilicen el simulador (003) y los escenarios.

## R3. Identificadores legibles
- **Decision**: el repositorio calcula el siguiente id con `max(numérico) + 1` sobre la tabla, empezando en `ALT-2001` e `INC-0401` (con relleno de 4 dígitos). Se calcula dentro de la misma transacción de inserción.
- **Rationale**: es una demo con un solo proceso y SQLite serializa las escrituras, así que no hay colisiones prácticas.
- **Alternatives considered**: una tabla de secuencias (complejidad innecesaria).

## R4. Concurrencia (dos pestañas)
- **Decision**: el servicio lee la alerta y valida la transición dentro de la misma transacción de escritura (`BEGIN IMMEDIATE` mediante `session.begin()` con el engine en modo `isolation_level="SERIALIZABLE"` de SQLite). La segunda acción ve el estado final y recibe 409 con `details = {currentStatus, lastActor, lastActionAt}`.
- **Rationale**: cumple el edge case de las dos pestañas sin bloqueos optimistas extra.

## R5. Hora en los mensajes de error
- **Decision**: el mensaje 409 incluye la hora local de Bogotá, formateada en `domain` con `timezone(timedelta(hours=-5))` (Colombia no tiene horario de verano). No se usa `zoneinfo` porque en Windows requiere el paquete `tzdata`.
- **Rationale**: es legible para el usuario y no añade dependencias.

## R6. Mensajes 422 en español
- **Decision**: el handler de `RequestValidationError` traduce los `type` de Pydantic más comunes: `missing` → "Este campo es obligatorio."; `string_too_short` → "Debe tener al menos {min_length} caracteres."; `string_too_long` → "Debe tener como máximo {max_length} caracteres."; `enum` y `literal_error` → "Valor no permitido."; `int_parsing` y `float_parsing` → "Debe ser un número."; cualquier otro → "Valor inválido.". Los errores de negocio (motivo `otro` sin texto, zona o tipo inexistente) los lanza `services` con `DomainError("VALIDACION", mensaje, {fields: [...]})`.
- **Rationale**: resuelve el pendiente de la feature 001 (FR-021).

## R7. DTO de acciones (unión discriminada)
- **Decision**: `AlertActionIn` es una unión discriminada por `action` (`review`, `confirm` con `note?` ≤ 500, `dismiss` con `reason` (DismissReason) y `comment?`, `comment` con `comment` de 3 a 500). `confirm` responde `201 {alert: AlertDetail, incident: IncidentRef}` y las demás `200 AlertDetail`.
- **Rationale**: valida cada forma en el borde (`api`) y coincide con el doc 08 §3.3.

## R8. Siembra relativa a "ahora"
- **Decision**: `infrastructure/seed/alerts.py::seed_alerts(session, now)` se ejecuta en el `lifespan` solo si `alerts` está vacía. Crea:
  - Las 12 activas del doc 10 §4: horas = `now - minutos`; las que están en revisión llevan revisor y evento `review` 1-3 min después de su creación.
  - 3 descartadas de hoy (2-6 h antes, en zonas distintas).
  - 3 descartadas de concentración en T1-EMBARQUE-A a los 25, 38 y 52 min (anomalía: 5 en los últimos 60 min).

  Las descripciones salen de las plantillas del doc 10 §5 (`seed/texts.py`). Todas las alertas generan su `created` en la timeline (actor Sistema o el autor del reporte manual).
- **Rationale**: la demo parece "en vivo" siempre (doc 10 §1). La feature 004 añadirá el histórico de 30 días y reorganizará la siembra para que los IDs sigan el orden cronológico.

## R9. Evidencia ilustrativa
- **Decision**: 7 SVG propios en `frontend/public/evidence/<type_code>.svg`, de estilo plano: escena simplificada (suelo, mobiliario) y un objeto o patrón por tipo. Las personas, como mucho, son siluetas genéricas sin rasgos y lejanas. `EvidenceViewer` superpone el marco de cámara (fuente y hora), un recuadro de detección posicionado sobre el objeto (coordenadas por tipo en `domain/evidence.ts`) y la leyenda.
- **Rationale**: privacidad (constitución V), coste cero y sin assets externos.

## R10. Plano 2D reutilizable
- **Decision**: `presentation/components/MiniMap2D.tsx` dibuja en SVG las zonas a partir de `geometry` (viewBox de la losa de 120 × 80 m, Z invertido para que la plataforma quede arriba), el color por `riskLevel`, el resaltado opcional de una zona, marcadores opcionales y una leyenda de texto. Accesible con `role="img"` y `aria-label` descriptivo.
- **Rationale**: lo usan el detalle (002), el Resumen (005) y el fallback del mapa 3D (006).

## R11. Modal "Reportar evento" global
- **Decision**: store `application/stores/reportEvent.ts` (`open()`, `close()`, `useReportEventOpen`). `ReportEventDialog` se monta una vez en `Shell`; lo abren el botón de la Topbar y el botón de la vista Alertas. Tras el éxito se invalida `alerts`, se navega a `/alertas` y se resalta el id creado (`?highlight=ALT-xxxx`).
- **Rationale**: un solo modal y sin prop drilling.

## R12. Review automático una sola vez
- **Decision**: `useAutoReview(alert)` en `application`: si `alert.status === 'nueva'`, dispara una mutación `review` protegida por un `useRef` (evita el doble disparo de React StrictMode). Si el backend responde 409, se ignora en silencio (otra persona ya la revisó) y se refresca.
- **Rationale**: es la HU-11 sin registros duplicados.
