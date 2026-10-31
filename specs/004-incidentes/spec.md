# Feature Specification: Gestión de incidentes e historial

**Feature Branch**: `004-incidentes`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Feature 004-incidentes de AeroSecure AI: ciclo de vida completo del incidente (asignar, atender, escalar, comentar, resolver), registro de incidentes con filtros y orden, detalle con timeline combinada, histórico sembrado de 30 días e incidentes de hoy, eventos en vivo de incidentes. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§3 y §6), `04-flujos-de-negocio.md` (F1 pasos 7-12), `docs/arquitectura-y-diseño/07-modelo-de-datos.md` (incidents, timeline_events), `08-especificacion-api.md` (§2 Incident, §3.4, §3.7 `incident.updated`), `09-ui-ux.md` (§3.5, §3.6, §4, §6), `10-datos-simulados-y-simulador.md` (§3 histórico y §4 hoy). Historias HU-16 a HU-21 (doc 02); RF-D1 a RF-D3 (doc 03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestionar un incidente hasta su resolución (Priority: P1)

Tras confirmar una alerta, el operador abre el incidente, le asigna un equipo, marca que la atención está en curso, lo escala a un equipo especializado si excede la capacidad, deja comentarios y finalmente lo resuelve con una nota de cierre. Cada paso queda en la historia con actor y hora (HU-16 a HU-20; F1 pasos 7-12).

**Why this priority**: completa el flujo principal de la demo ("de la alerta a la resolución").

**Independent Test**: confirmar una alerta y llevar su incidente por asignar → atender → escalar → resolver, comprobando estados, validaciones, diálogos y la historia.

**Acceptance Scenarios**:

1. **Given** un incidente abierto sin equipo, **When** el operador intenta "Atender", **Then** el botón está deshabilitado y su tooltip explica "Asigna un equipo antes de iniciar la atención".
2. **Given** un incidente abierto, **When** asigna "Seguridad T1" con un comentario opcional, **Then** el equipo queda visible, la historia muestra "Asignado a Seguridad T1" y el estado no cambia.
3. **Given** un incidente con equipo, **When** pulsa "Atender", **Then** pasa a "En atención" y se registra la hora de inicio.
4. **Given** un incidente abierto o en atención, **When** pulsa "Escalar", elige un equipo especializado (EOD, Policía, Médico) y escribe un motivo de al menos 10 caracteres y confirma el diálogo, **Then** pasa a "Escalado", el equipo responsable pasa a ser el especializado y la historia registra el motivo.
5. **Given** el diálogo de escalar, **When** se intenta elegir un equipo no especializado, **Then** no está disponible en la lista; y si el motivo es corto, se muestra el error y no se envía.
6. **Given** un incidente escalado, **When** el equipo especializado lo toma ("Atender"), **Then** vuelve a "En atención".
7. **Given** un incidente en atención o escalado, **When** pulsa "Resolver", escribe una nota de cierre de al menos 10 caracteres y confirma, **Then** pasa a "Resuelto", se calcula el tiempo de resolución y ya no hay acciones salvo comentar.
8. **Given** un incidente resuelto u otra transición no permitida (p. ej., desde otra pestaña), **When** se intenta, **Then** se rechaza con un mensaje legible que indica el estado actual, quién y cuándo.
9. **Given** cualquier cambio de un incidente, **When** se realiza, **Then** las demás pestañas lo ven actualizado en ≤ 2 s sin recargar.

---

### User Story 2 - Consultar el registro de incidentes (Priority: P1)

El supervisor (y el operador) consulta todos los incidentes con búsqueda, rango de fechas, filtros por severidad, zona, tipo y estado, orden por fecha, severidad o tiempo de respuesta, y paginación de 20 (HU-21, RF-D1).

**Why this priority**: da la vista histórica que alimenta el análisis y la trazabilidad.

**Independent Test**: con el histórico sembrado, abrir Incidentes, aplicar los presets Hoy / 7 días / 30 días, filtros y orden, y verificar los totales.

**Acceptance Scenarios**:

1. **Given** el histórico sembrado, **When** se abre Incidentes con el rango de 30 días, **Then** la tabla muestra alrededor de 160 incidentes paginados de 20 en 20, con el total visible.
2. **Given** el preset "Hoy", **When** se aplica, **Then** solo aparecen los incidentes abiertos hoy (6 resueltos + 3 en curso + los creados en la sesión).
3. **Given** el orden por tiempo de respuesta descendente, **When** se aplica, **Then** el primero es el de mayor tiempo de respuesta.
4. **Given** filtros y orden, **When** se recarga o se comparte el enlace, **Then** se conservan.
5. **Given** la tabla, **When** el usuario navega con el teclado y pulsa Enter, **Then** abre el detalle del incidente.
6. **Given** filtros sin resultados, **When** se aplican, **Then** se muestra "Sin incidentes que coincidan" con "Limpiar filtros".

---

### User Story 3 - Ver el detalle y la historia completa de un incidente (Priority: P2)

El usuario abre un incidente y ve su estado, severidad (de la alerta), zona, equipo, tiempos de respuesta y resolución, el resumen de la alerta de origen con enlace, y la historia combinada de la alerta y el incidente en orden cronológico (HU-20, RF-D2).

**Why this priority**: es el soporte de la trazabilidad; depende de US1 para las acciones.

**Independent Test**: abrir un incidente histórico resuelto y uno escalado, y comprobar que su historia muestra la secuencia completa desde la creación de la alerta.

**Acceptance Scenarios**:

1. **Given** un incidente histórico resuelto, **When** se abre, **Then** la historia muestra en orden: alerta generada, revisión, confirmación, incidente creado, asignación, atención, [escalamiento] y resolución, con actores y horas.
2. **Given** el detalle, **When** se muestra, **Then** incluye el panel "Alerta de origen" con su tipo, severidad, zona y enlace a la alerta.
3. **Given** un identificador inexistente, **When** se abre, **Then** se muestra "El incidente INC-xxxx no existe" con enlace al registro.
4. **Given** una alerta confirmada, **When** se pulsa "Ver incidente INC-xxxx", **Then** se abre este detalle (ya no un placeholder).

---

### User Story 4 - Datos históricos realistas (Priority: P2)

Al preparar la demo, el sistema genera el histórico de los últimos 30 días y la actividad de hoy (doc 10 §3-§4), con horas relativas al momento actual, para que el registro y, más adelante, el resumen y el análisis tengan datos coherentes.

**Why this priority**: sin histórico, el registro y los análisis no demuestran valor.

**Independent Test**: con una base nueva, comprobar cantidades, distribución por severidad, picos horarios, tiempos de respuesta y resolución, escalados e incidentes de hoy.

**Acceptance Scenarios**:

1. **Given** una base nueva, **When** se generan los datos, **Then** hay ≈ 220 alertas en los 30 días anteriores (≈ 150 confirmadas con incidente resuelto y ≈ 70 descartadas), con tendencia ligeramente creciente en la última semana.
2. **Given** los incidentes históricos, **When** se analizan, **Then** los tiempos de respuesta están entre 1 y 8 min (críticos 1-3 min) y los de resolución entre 15 y 120 min (escalados 45-180 min); ≈ 10 % están escalados.
3. **Given** hoy, **When** se consulta, **Then** existen 6 incidentes resueltos hoy y 3 en curso: abierto sin equipo (hace 20 min), en atención con Seguridad T1 (hace 35 min) y escalado a Policía (hace 50 min).
4. **Given** el conjunto completo, **When** se ordena por fecha, **Then** los identificadores ALT/INC crecen con el tiempo (los históricos tienen IDs menores que los de hoy).

### Edge Cases

- Reasignar un equipo a un incidente escalado: permitido; registra la reasignación.
- Doble clic en "Resolver": se envía una sola vez.
- Dos pestañas resuelven a la vez: la segunda recibe el rechazo legible y la vista se refresca.
- Filtros con rango invertido (desde > hasta): se ignora el rango.
- El incidente recibe comentarios después de resuelto: permitido, no cambia el estado.
- Un incidente creado en la sesión aparece en el registro sin recargar (evento en vivo).

## Requirements *(mandatory)*

### Functional Requirements

**Dominio**

- **FR-001**: El sistema MUST aplicar la máquina de estados del doc 05 §3: assign (abierto, en atención, escalado; sin cambio de estado), start (abierto, escalado → en atención; requiere equipo), escalate (abierto, en atención → escalado; equipo especializado + motivo ≥ 10), resolve (en atención, escalado → resuelto; nota ≥ 10) y comment (cualquiera; 3-500).
- **FR-002**: Las transiciones no permitidas MUST rechazarse con un mensaje que indique el estado actual, el último actor y la hora; la falta de equipo al atender MUST informarse como "equipo requerido".
- **FR-003**: Al escalar, el equipo responsable MUST pasar a ser el especializado y registrarse el destino del escalamiento y su hora.
- **FR-004**: Al resolver, el sistema MUST registrar la hora de resolución, el tiempo de resolución (desde la detección de la alerta) y el tiempo de respuesta (primera acción humana sobre la alerta).
- **FR-005**: Toda acción MUST registrar su evento en la historia del incidente, en la misma operación, con actor y hora, y publicarse en vivo (`incident.updated`) tras guardarse.

**Consulta**

- **FR-006**: El sistema MUST listar incidentes con búsqueda (ID del incidente, ID de la alerta o descripción), rango de fechas (apertura), filtros por estado, severidad, zona y tipo (de la alerta), orden por fecha de apertura, severidad o tiempo de respuesta, y paginación de 20 con total.
- **FR-007**: El sistema MUST entregar el detalle del incidente con la alerta de origen y la historia combinada (alerta + incidente) en orden cronológico.

**Datos**

- **FR-008**: La preparación de datos MUST generar el histórico (doc 10 §3) y los incidentes de hoy (doc 10 §4) además de las alertas activas ya existentes, con IDs crecientes en orden cronológico y con una semilla aleatoria fija para que la forma de los datos sea reproducible.

**Interfaz**

- **FR-009**: La vista Incidentes MUST seguir el doc 09 §3.5 (búsqueda, presets Hoy / 7 días / 30 días y rango personalizado, filtros, columnas, orden, paginación, filtros en la URL, tabla accesible por teclado). El botón "Exportar CSV" queda para la feature 007.
- **FR-010**: El detalle del incidente MUST seguir el doc 09 §3.6: encabezado, panel de alerta de origen, acciones según el estado con tooltips explicativos en los botones deshabilitados, diálogos para escalar (selector solo de especializados + motivo) y resolver (nota), asignación con selector de equipos y la historia combinada.
- **FR-011**: Las acciones irreversibles (escalar, resolver) MUST pedir confirmación; los botones se deshabilitan mientras se procesa la petición.
- **FR-012**: El menú lateral MUST mostrar el contador de incidentes en curso (abierto + en atención + escalado) junto a "Incidentes", actualizado en vivo.
- **FR-013**: Las vistas MUST implementar los estados de carga, vacío, error y éxito, y actualizarse en vivo ante `incident.created` y `incident.updated`.

**Restricciones**

- **FR-014**: Capas de la constitución; sin pruebas automatizadas ni dependencias nuevas.

### Key Entities

- **Incidente**: situación confirmada por una persona: estado, equipo, destino del escalamiento, quién lo abrió, horas (apertura, inicio, escalamiento, resolución), nota de cierre, tiempos de respuesta y resolución, alerta de origen (única).
- **Evento de historia**: registro inmutable (ya existente) que ahora también cubre las acciones del incidente.
- **Equipo**: catálogo existente; solo los especializados pueden recibir escalamientos.

## Success Criteria *(mandatory)*

- **SC-001**: Un operador lleva un incidente de abierto a resuelto (asignar, atender, resolver) en menos de 90 segundos.
- **SC-002**: El 100 % de los escalamientos y resoluciones pasa por confirmación y queda en la historia con actor, hora y motivo o nota.
- **SC-003**: El registro con ~160 incidentes carga y filtra en menos de 1 segundo.
- **SC-004**: El 100 % de los incidentes históricos muestra una historia completa y coherente desde la alerta de origen.
- **SC-005**: Las distribuciones sembradas cumplen los rangos del doc 10 §3 (tiempos, % escalados y proporción confirmadas/descartadas ± 5 puntos).
- **SC-006**: Un cambio en un incidente se ve en otras pestañas en ≤ 2 segundos.

## Assumptions

- Features 001-003 completas (alertas, creación de incidente al confirmar, bus de eventos y suscriptor).
- La semilla se regenera solo con una base vacía; para ver el histórico en un entorno existente hay que borrar la base (el reinicio desde la UI llega en 008).
- La severidad, la zona y el tipo del incidente se toman de su alerta de origen (doc 07).
- La exportación CSV y la sección Reportes llegan en la feature 007; el Resumen y sus KPIs en la 005.
- Validación manual con quickstart.md y HU-16 a HU-21 del checklist del doc 11 §3.
