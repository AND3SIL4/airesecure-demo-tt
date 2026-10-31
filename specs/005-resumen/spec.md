# Feature Specification: Resumen operativo (dashboard)

**Feature Branch**: `005-resumen`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Feature 005-resumen de AeroSecure AI: KPIs con variación frente a ayer, alertas prioritarias, mini-mapa 2D con zonas y marcadores, incidentes por categoría (7 días), tendencia de 24 h, aviso y lista de anomalías basadas en reglas, y botón Críticas (N). Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§6 métricas, §7 anomalías), `docs/arquitectura-y-diseño/08-especificacion-api.md` (§3.2), `09-ui-ux.md` (§2 botón Críticas, §3.2 Resumen, §4, §6), `10-datos-simulados-y-simulador.md` (§4 anomalía sembrada). Historias HU-03, HU-04, HU-07, HU-09 y HU-24 (aviso en Resumen) del doc 02; RF-B1 a RF-B5 (doc 03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender el estado de la seguridad en segundos (Priority: P1)

Al entrar, el operador ve en el Resumen 5 indicadores clave: alertas activas, críticas activas, incidentes en curso, resueltos hoy y tiempo medio de respuesta de hoy. Cada uno muestra su variación frente a ayer a la misma hora, con flecha y color semántico (HU-03, RF-B1).

**Why this priority**: es la primera pantalla de la demo y responde "¿cómo estamos ahora?".

**Independent Test**: con los datos sembrados, comparar los valores de los KPIs con las consultas de alertas e incidentes y comprobar que las variaciones son coherentes.

**Acceptance Scenarios**:

1. **Given** los datos sembrados, **When** se abre el Resumen, **Then** se ven los 5 KPIs con su valor: alertas activas = 12, críticas activas = 2, incidentes en curso = 3 y resueltos hoy = 6, más el tiempo medio de respuesta de hoy en minutos.
2. **Given** un KPI, **When** se muestra su variación, **Then** incluye una flecha, el porcentaje o la diferencia y un texto accesible ("12 % más que ayer"); para alertas, críticas y tiempo de respuesta, subir se marca como "peor"; para resueltos, subir es "mejor".
3. **Given** que llega una alerta nueva o se resuelve un incidente, **When** ocurre, **Then** los KPIs se actualizan en ≤ 2 s sin recargar.

---

### User Story 2 - Ver qué atender primero y dónde (Priority: P1)

El Resumen lista hasta 6 alertas activas ordenadas por prioridad (score) con enlace a "Ver todas", y un mini-mapa 2D de la terminal con las zonas coloreadas por riesgo y marcadores por severidad. El botón "Críticas (N)" de la barra superior lleva a las alertas críticas activas desde cualquier vista (HU-04, HU-07, HU-09).

**Why this priority**: convierte la visión general en acción inmediata.

**Independent Test**: comprobar que la primera alerta del Resumen coincide con la primera de la lista de Alertas, que el mapa refleja el riesgo de cada zona y que "Críticas (N)" lleva a la lista filtrada con N resultados.

**Acceptance Scenarios**:

1. **Given** los datos sembrados, **When** se abre el Resumen, **Then** el bloque "Alertas prioritarias" muestra 6 filas ordenadas por score, con la severidad (icono y texto), el tipo, la zona y la hora relativa; al hacer clic se abre el detalle.
2. **Given** el mini-mapa, **When** se muestra, **Then** cada zona tiene el color de su riesgo, hay un marcador por alerta activa con su severidad y una leyenda de texto; al hacer clic en una zona se abre la lista de Alertas filtrada por esa zona.
3. **Given** cualquier vista, **When** hay N alertas críticas activas, **Then** el botón de la barra superior dice "Críticas (N)", se resalta si N > 0 y lleva a Alertas con los filtros "activas" y "crítica".

---

### User Story 3 - Detectar tendencias y anomalías (Priority: P2)

El Resumen muestra la distribución de incidentes por categoría de los últimos 7 días (dona con el total al centro), la tendencia de alertas de las últimas 24 horas (línea por hora) y la lista de anomalías detectadas por reglas ("Aumento inusual · Sala de embarque A · +N %"), siempre etiquetadas como demostrativas (HU-24, RF-B4, RF-B5).

**Why this priority**: aporta la parte analítica "inteligente" de la demo, pero no es necesaria para operar.

**Independent Test**: con la anomalía sembrada (5 alertas de concentración en la Sala de embarque A en la última hora), verificar que aparece en el Resumen con su variación y la etiqueta "Detección basada en reglas · demostrativa".

**Acceptance Scenarios**:

1. **Given** los datos sembrados, **When** se abre el Resumen, **Then** aparece al menos la anomalía de la Sala de embarque A (zona) y la de "Concentración inusual de personas" (tipo), con el conteo de la última hora, la media de referencia y la variación.
2. **Given** que no hay anomalías, **When** se abre el Resumen, **Then** el bloque muestra "Sin anomalías detectadas".
3. **Given** el gráfico de categorías, **When** se pasa el cursor o el foco por un segmento, **Then** se ve el nombre del tipo y su número; el gráfico tiene un resumen textual accesible.
4. **Given** la tendencia de 24 h, **When** se muestra, **Then** hay 24 puntos (uno por hora, en hora de Bogotá), con tooltip.

### Edge Cases

- Sin datos de ayer para comparar (variación indefinida): se muestra "Sin datos de ayer" en lugar de un porcentaje.
- Ayer = 0 y hoy > 0: se muestra la diferencia absoluta ("+3 vs ayer") en lugar de un porcentaje infinito.
- Una zona sin alertas activas: color "normal" y ningún marcador.
- Error al cargar el resumen: estado de error con "Reintentar"; la barra superior sigue funcionando.
- Media histórica de una zona prácticamente nula: se usa un mínimo de referencia para no mostrar variaciones absurdas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST calcular los KPIs del doc 05 §6: alertas activas (nueva + en revisión), críticas activas, incidentes en curso (abierto + en atención + escalado), resueltos hoy (desde las 00:00 de Bogotá) y tiempo medio de respuesta de los incidentes abiertos hoy.
- **FR-002**: Cada KPI MUST incluir su variación frente a ayer (de 00:00 a la misma hora): para alertas activas y críticas se comparan las alertas detectadas en la ventana de hoy con las de ayer (totales y críticas); para incidentes en curso, los incidentes abiertos en cada ventana; para resueltos, los resueltos en cada ventana; y el tiempo medio de respuesta de cada ventana.
- **FR-003**: El sistema MUST entregar las 6 alertas activas de mayor score, el estado por zona (riesgo y alertas activas), los incidentes por tipo de los últimos 7 días, las alertas por hora de las últimas 24 h y las anomalías vigentes, en una sola consulta del resumen.
- **FR-004**: Las anomalías MUST calcularse con la regla del doc 05 §7: para cada zona y cada tipo, el conteo de alertas de los últimos 60 minutos frente a la media horaria de los últimos 7 días (con un mínimo de referencia de 1 alerta/h), con anomalía si el conteo es ≥ 5 (mínimo ajustado para la demo) y ≥ 1,5 × la referencia, y una variación = (conteo / referencia − 1) × 100.
- **FR-005**: La interfaz MUST mostrar el Resumen del doc 09 §3.2 con los 5 KpiCard, las alertas prioritarias, el mini-mapa 2D con marcadores, la dona por categoría, la tendencia de 24 h y las anomalías, con los estados de carga, error y vacío.
- **FR-006**: El botón "Críticas (N)" MUST habilitarse en la barra superior con el número de alertas críticas activas, actualizado en vivo, y navegar a la lista filtrada.
- **FR-007**: El Resumen MUST actualizarse en vivo ante los eventos de alertas e incidentes.
- **FR-008**: La vista previa temporal de componentes de la feature 001 MUST retirarse del Resumen.
- **FR-009**: Los gráficos MUST tener un título que responda una pregunta, tooltips y un resumen textual accesible (doc 09 §3.8 y §6).
- **FR-010**: Capas de la constitución; sin pruebas automatizadas. La única dependencia nueva permitida es la librería de gráficos aprobada (Recharts).

### Key Entities

- **Resumen**: composición de KPIs, variaciones, alertas prioritarias, estado de zonas, distribución por tipo, tendencia horaria y anomalías (no persistido).
- **Anomalía**: ámbito (zona o tipo), clave, etiqueta, conteo de la última hora, media de referencia y variación %.

## Success Criteria *(mandatory)*

- **SC-001**: Una persona nueva identifica el número de alertas críticas y la alerta más prioritaria en menos de 5 segundos tras abrir el Resumen.
- **SC-002**: El Resumen carga en menos de 1 segundo en el equipo local.
- **SC-003**: Los KPIs coinciden al 100 % con los totales de las listas de Alertas e Incidentes.
- **SC-004**: La anomalía sembrada se detecta en el 100 % de los arranques con datos nuevos.
- **SC-005**: Los cambios (alerta nueva o incidente resuelto) se reflejan en el Resumen en ≤ 2 segundos.

## Assumptions

- Features 001-004 completas; `MiniMap2D` y la geometría de zonas ya existen.
- Recharts está aprobado en la constitución y se instala en esta feature.
- La ventana "hoy" empieza a las 00:00 de America/Bogota (UTC-5).
- El endpoint dedicado `/api/analytics/anomalies` y la página Análisis llegan en la feature 007; aquí la lógica de anomalías se implementa en el dominio y se expone dentro del resumen.
- Validación manual con quickstart.md y HU-03, HU-04, HU-07 y HU-09 del doc 11 §3.
