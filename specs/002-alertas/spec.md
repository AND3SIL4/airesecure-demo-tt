# Feature Specification: Gestión de alertas (lista, detalle, decisión y reporte manual)

**Feature Branch**: `002-alertas`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Especifica la feature 002-alertas de AeroSecure AI: dominio de alerta (máquina de estados con revisión implícita, score explicable, umbrales), registro de alertas, incidentes (solo su creación al confirmar) y bitácora; siembra de las alertas activas, las descartadas de hoy y la anomalía; nivel de riesgo real por zona; consulta, filtros, detalle, acciones (revisar, confirmar, descartar, comentar) y reporte manual; vistas de lista y detalle; modal Reportar evento; mensajes de validación en español. Fuera de alcance: tiempo real, simulador, gestión de incidentes, resumen, mapa 3D, análisis y configuración. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§1, §2, §4, §5, §8), `docs/arquitectura-y-diseño/07-modelo-de-datos.md` (alerts, incidents, timeline_events, índices e integridad), `08-especificacion-api.md` (§1, §2, §3.3), `09-ui-ux.md` (§3.3, §3.4, §3.11, §4, §6, §8), `10-datos-simulados-y-simulador.md` (§4-§6). Historias HU-04, HU-06 y HU-10 a HU-15 (doc 02); flujos F1 pasos 1-6, F2 y F4 (doc 04); RF-C1 a RF-C7 y RF-H1-H2 (doc 03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver y priorizar las alertas activas (Priority: P1)

El operador abre la sección Alertas y ve las alertas activas ordenadas por prioridad (score). Cada fila muestra la severidad con icono y texto, el identificador, el tipo, la zona, la fuente, la confianza, el score, el estado y la hora relativa. Puede filtrar por estado, severidad, zona, tipo y fuente, buscar por texto, ordenar y paginar, y comparte la vista filtrada con solo copiar la dirección (HU-04, HU-06).

**Why this priority**: es el punto de entrada operativo. Sin una lista priorizada, el operador no sabe qué atender primero.

**Independent Test**: con los datos sembrados, abrir Alertas y comprobar que aparecen las 12 alertas activas ordenadas por score; aplicar combinaciones de filtros y búsqueda; recargar y verificar que los filtros se conservan.

**Acceptance Scenarios**:

1. **Given** los datos sembrados, **When** el operador abre Alertas, **Then** ve por defecto las alertas activas (nuevas y en revisión) ordenadas por score descendente (en caso de empate, por la más reciente) y la primera es la de equipaje abandonado crítica de la Sala de equipajes.
2. **Given** la lista, **When** filtra por severidad "Crítica", **Then** solo ve alertas críticas, el filtro aparece como un chip y la dirección de la página lo refleja.
3. **Given** filtros aplicados, **When** recarga la página o comparte el enlace, **Then** la vista muestra los mismos filtros y resultados.
4. **Given** la lista, **When** busca "ALT-" seguido de parte de un identificador, o una palabra de la descripción, **Then** ve solo las coincidencias.
5. **Given** filtros sin resultados, **When** se aplican, **Then** ve el estado vacío "Sin alertas que coincidan" con la acción "Limpiar filtros".
6. **Given** la tabla, **When** navega con las flechas arriba y abajo y pulsa Enter, **Then** abre el detalle de la alerta enfocada.
7. **Given** más de 20 resultados (p. ej., con el filtro de todos los estados), **When** cambia de página, **Then** ve la siguiente página y el total de resultados.

---

### User Story 2 - Revisar el detalle de una alerta y entender por qué se priorizó (Priority: P1)

El operador abre una alerta y entiende qué pasó, dónde, cuándo y por qué fue detectada. Ve la evidencia ilustrativa, la descripción, la ubicación en el plano, la confianza, el desglose del score, la recomendación, los pasos del protocolo y la historia de acciones. Si la alerta era nueva, pasa a "En revisión" automáticamente una sola vez y queda registrado quién la abrió (HU-10, HU-11).

**Why this priority**: sin contexto no hay decisión humana informada; es el núcleo de la transparencia de la demo.

**Independent Test**: abrir una alerta nueva y comprobar todas las secciones y su paso a "En revisión" con el actor en la historia; volver a abrirla y verificar que no se registra una segunda revisión.

**Acceptance Scenarios**:

1. **Given** una alerta en estado nueva, **When** el operador abre su detalle, **Then** el estado cambia a "En revisión", la historia muestra "Revisión iniciada por Operador 01" con la hora, y al abrirla otra vez no se agrega otro registro de revisión.
2. **Given** el detalle, **When** se muestra, **Then** el encabezado incluye severidad, estado, identificador, tipo, zona, hora absoluta y relativa, y la etiqueta "Predicción demostrativa".
3. **Given** el detalle, **When** se muestra la sección "Por qué se priorizó", **Then** aparecen el score y sus tres factores (severidad, confianza y criticidad de la zona), y el score coincide con el resultado de multiplicarlos.
4. **Given** el detalle, **When** se muestra la evidencia, **Then** es una ilustración del tipo de alerta, sin personas identificables, con el marco de cámara (fuente y hora), un recuadro sobre el objeto y la leyenda "Imagen ilustrativa · sin datos personales".
5. **Given** una alerta de reporte manual, **When** se muestra su confianza, **Then** aparece "N/A: reporte humano".
6. **Given** el detalle, **When** se muestra la ubicación, **Then** un plano 2D de la terminal resalta la zona de la alerta.

---

### User Story 3 - Confirmar una alerta o descartarla como falso positivo (Priority: P1)

Tras revisar, el operador confirma la alerta (y se crea el incidente vinculado) o la marca como falso positivo indicando un motivo. Ambas acciones son irreversibles y piden confirmación. También puede dejar comentarios sin cambiar el estado (HU-12, HU-13, HU-14; flujos F1 pasos 1-6 y F2).

**Why this priority**: es la decisión humana que da sentido al producto ("la IA prioriza, la persona decide").

**Independent Test**: confirmar una alerta y verificar el incidente creado y el enlace; descartar otra sin motivo (rechazo) y con motivo (éxito); intentar actuar sobre una alerta ya cerrada (mensaje claro).

**Acceptance Scenarios**:

1. **Given** una alerta en revisión, **When** el operador pulsa "Confirmar incidente", escribe una nota opcional y acepta el diálogo, **Then** la alerta pasa a "Confirmada", se crea un incidente "INC-xxxx" en estado abierto vinculado a ella, la historia registra ambas acciones con el actor y se muestra el aviso "Alerta ALT-xxxx confirmada. Se creó el incidente INC-xxxx".
2. **Given** una alerta confirmada, **When** se ve su detalle, **Then** en lugar de los botones de decisión aparece el enlace "Ver incidente INC-xxxx".
3. **Given** una alerta en revisión, **When** el operador elige "Marcar como falso positivo" sin seleccionar un motivo, **Then** no puede confirmar y ve el error "Selecciona un motivo".
4. **Given** el motivo "Otro", **When** el texto tiene menos de 10 caracteres, **Then** ve un error de validación y no se envía nada.
5. **Given** un motivo válido, **When** acepta el diálogo, **Then** la alerta pasa a "Descartada", no se crea ningún incidente y el detalle muestra el motivo y quién la descartó.
6. **Given** el diálogo de confirmación o de descarte abierto, **When** el operador cancela, **Then** la alerta sigue en revisión y no se registra nada.
7. **Given** una alerta nueva que otra persona confirma o descarta directamente, **When** se ejecuta la decisión, **Then** la historia muestra primero la revisión implícita y luego la decisión.
8. **Given** una alerta ya confirmada o descartada (p. ej., en otra pestaña), **When** se intenta confirmarla o descartarla, **Then** el sistema la rechaza y muestra "La alerta ALT-xxxx ya fue <estado> por <actor> a las <hora>".
9. **Given** cualquier alerta, **When** el operador agrega un comentario de 3 a 500 caracteres, **Then** el comentario aparece en la historia con su autor, sin cambiar el estado.

---

### User Story 4 - Reportar un evento manualmente (Priority: P2)

Un operador recibe por radio un aviso del personal y lo registra desde el botón "Reportar evento" (en la barra superior o en Alertas). Elige el tipo, la zona, la severidad sugerida y escribe una descripción; el sistema crea una alerta nueva de fuente "reporte manual" que sigue el mismo ciclo que las demás (HU-15, flujo F4).

**Why this priority**: completa el ciclo de captura de información, pero el núcleo de la demo es la revisión de alertas detectadas.

**Independent Test**: abrir el modal desde la barra superior, intentar enviarlo vacío (bloqueado), completarlo y comprobar que la nueva alerta aparece en la lista, resaltada y con confianza "N/A".

**Acceptance Scenarios**:

1. **Given** cualquier vista, **When** el operador pulsa "Reportar evento", **Then** se abre un modal con Tipo, Zona, Severidad sugerida (con iconos) y Descripción (con un contador de 10 a 500 caracteres).
2. **Given** el modal con campos incompletos, **When** el operador intenta enviar, **Then** el botón "Reportar" está deshabilitado y cada campo inválido muestra su mensaje.
3. **Given** el formulario válido, **When** envía, **Then** ve el aviso "Evento reportado como ALT-xxxx", el modal se cierra y la nueva alerta aparece en la lista de Alertas, resaltada.
4. **Given** el tipo "Incidente reportado por un operador", **When** se envía, **Then** la severidad es la elegida por quien reporta y la alerta registra quién la reportó.

---

### User Story 5 - Ver el riesgo real por zona (Priority: P3)

Los catálogos de zonas reflejan ahora el riesgo real: cada zona expone el nivel de la alerta activa más severa y el número de alertas activas, lo que alimenta el plano de ubicación del detalle y, más adelante, el resumen y el mapa.

**Why this priority**: es un habilitador para las features 005 y 006, con poco valor visible por sí solo.

**Independent Test**: consultar las zonas con los datos sembrados y comparar con las alertas activas de cada zona; confirmar o descartar una alerta y ver el cambio.

**Acceptance Scenarios**:

1. **Given** los datos sembrados, **When** se consultan las zonas, **Then** la Sala de equipajes y la Plataforma tienen riesgo "crítica" y la Zona comercial tiene riesgo "baja".
2. **Given** una zona sin alertas activas, **When** se consulta, **Then** su riesgo es "normal" con 0 alertas activas.
3. **Given** que se descarta la única alerta activa de una zona, **When** se vuelve a consultar, **Then** la zona pasa a "normal".

### Edge Cases

- Se abre un identificador de alerta inexistente: se muestra el estado de error "La alerta ALT-xxxx no existe" con un enlace a la lista.
- Doble clic en "Confirmar" o en "Descartar": la acción se envía una sola vez (el botón queda deshabilitado mientras se procesa).
- Dos pestañas actúan sobre la misma alerta: la segunda acción recibe el rechazo con el estado y el actor actuales, y la vista se refresca.
- Falla la red o el servidor durante una acción: aviso de error con el mensaje del sistema; el estado visible no cambia.
- Un parámetro de filtro inválido en la dirección (p. ej., una severidad inexistente): se ignora y se muestra la lista sin ese filtro.
- Se comenta una alerta ya cerrada: está permitido y no reabre la alerta.
- Se reporta un evento con una zona o un tipo inexistentes: se rechaza con un mensaje de validación en español.
- Con reducción de movimiento activada, el resaltado de la alerta nueva no se anima.

## Requirements *(mandatory)*

### Functional Requirements

**Dominio y reglas**

- **FR-001**: El sistema MUST gestionar el ciclo de vida de la alerta según el doc 05 §2: estados nueva, en revisión, confirmada y descartada; las dos últimas son finales.
- **FR-002**: El sistema MUST permitir las acciones revisar (solo desde nueva), confirmar y descartar (desde nueva o en revisión) y comentar (en cualquier estado), y rechazar cualquier otra combinación con un mensaje que indique el estado actual, quién hizo el último cambio y cuándo.
- **FR-003**: Al confirmar o descartar una alerta nueva, el sistema MUST registrar primero una revisión implícita del mismo actor.
- **FR-004**: Al confirmar, el sistema MUST crear en la misma operación un incidente en estado abierto, vinculado a la alerta (como máximo uno por alerta), con un identificador legible INC-xxxx correlativo.
- **FR-005**: Descartar MUST exigir un motivo del catálogo; el motivo "Otro" exige un texto de al menos 10 caracteres. La nota al confirmar es opcional (máx. 500) y el comentario va de 3 a 500 caracteres.
- **FR-006**: Cada alerta MUST tener un score de 0-100 calculado con la fórmula del doc 05 §5 y guardar su desglose (peso de la severidad, confianza, factor de zona y criticidad), que se muestra al usuario. Los reportes manuales usan confianza 1,0 para el cálculo y se muestran como "N/A: reporte humano".
- **FR-007**: El sistema MUST registrar el momento de la primera acción humana (para el tiempo de respuesta) y el de cierre (al confirmar o descartar).

**Bitácora**

- **FR-008**: Toda creación, revisión, confirmación, descarte, comentario y creación de incidente MUST quedar en la historia con el actor (o "Sistema"), la acción, el estado anterior y el nuevo, el comentario y la hora, en la misma operación que el cambio (RF-H1).
- **FR-009**: La historia MUST ser de solo inserción y mostrarse en orden cronológico (RF-H2).

**Datos de demostración**

- **FR-010**: Al preparar los datos, el sistema MUST sembrar las 12 alertas activas del doc 10 §4 (con sus horas relativas al momento actual, su estado, su revisor cuando estén en revisión y su historia), 3 alertas descartadas hoy y las alertas descartadas de la última hora necesarias para que la Sala de embarque A tenga 5 alertas de concentración en los últimos 60 minutos.
- **FR-011**: La siembra de alertas MUST ejecutarse solo si no existen alertas, para no duplicar datos en arranques sucesivos.

**Consulta**

- **FR-012**: El sistema MUST permitir listar alertas con filtros por estado (incluido el atajo "activas"), severidad, zona, tipo, fuente, texto (identificador o descripción) y rango de fechas; orden por score, fecha o severidad; y paginación de 20, informando del total (RF-C1).
- **FR-013**: El sistema MUST entregar el detalle completo de una alerta: tipo, severidad, estado, zona, fuente, hora, confianza, score y desglose, descripción, recomendación, protocolo, evidencia ilustrativa, motivo de descarte, revisor, incidente vinculado e historia (RF-C3).
- **FR-014**: El catálogo de zonas MUST reflejar, para cada zona, la severidad máxima de sus alertas activas (o "normal") y su número de alertas activas.

**Reporte manual**

- **FR-015**: El sistema MUST permitir reportar un evento con tipo, zona, severidad sugerida y descripción (10 a 500 caracteres), y crear una alerta nueva con fuente "reporte manual" y el actor como autor del reporte (RF-C6).

**Interfaz**

- **FR-016**: La vista Alertas MUST mostrar la tabla con las columnas del doc 09 §3.3, los filtros reflejados en la dirección, los chips de filtros activos, la acción "Limpiar filtros", el orden por columna, la paginación y la navegación por teclado.
- **FR-017**: La vista de detalle MUST seguir el doc 09 §3.4: encabezado, evidencia, descripción, "Por qué se priorizó", recomendación, protocolo (checklist visual no persistente), historia, ubicación en un plano 2D, confianza y barra de acciones según el estado.
- **FR-018**: Confirmar y descartar MUST pedir confirmación en un diálogo accesible; los botones de acción se deshabilitan mientras se procesa la petición.
- **FR-019**: El botón "Reportar evento" de la barra superior MUST quedar habilitado y abrir el modal; la vista Alertas también ofrece el acceso.
- **FR-020**: Toda vista o acción de esta feature MUST mostrar los estados de carga, vacío, error con reintento y éxito con aviso (RNF-09).
- **FR-021**: Los mensajes de validación del sistema MUST mostrarse en español, legibles para el usuario.
- **FR-022**: La interfaz MUST comunicar severidad y estado con icono, texto y color; no afirmar certeza (p. ej., "Posible equipaje sin supervisión") y etiquetar la predicción como demostrativa.

**Restricciones**

- **FR-023**: La feature MUST respetar la arquitectura por capas de la constitución y NO incluir pruebas automatizadas.

### Key Entities *(include if feature involves data)*

- **Alerta**: señal que requiere revisión humana. Tiene identificador legible ALT-xxxx, tipo, severidad, estado, zona, fuente, origen (semilla, simulador, escenario o manual), hora de detección, confianza (vacía en los reportes manuales), score y su desglose, descripción, recomendación, clave de evidencia ilustrativa, motivo de descarte, revisor, autor del reporte (manual), primera acción y cierre.
- **Incidente**: situación confirmada por una persona. Identificador INC-xxxx, alerta de origen (única), estado (en esta feature solo "abierto"), quién lo abrió y cuándo. La gestión completa llega en la feature 004.
- **Evento de historia (timeline)**: registro inmutable de una acción sobre una alerta o un incidente, con su actor, su acción, el estado anterior y el nuevo, el comentario, los datos adicionales y la hora.
- **Motivo de descarte**: catálogo fijo del doc 05 §4.3 (existente desde la feature 001).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un operador identifica la alerta más prioritaria en menos de 5 segundos tras abrir Alertas (la primera fila es la de mayor score).
- **SC-002**: Un operador completa el flujo abrir → revisar → confirmar una alerta crítica en menos de 60 segundos y en 4 clics o menos tras abrir el detalle.
- **SC-003**: El 100 % de las acciones de decisión (confirmar o descartar) pasa por un diálogo de confirmación y queda en la historia con su actor y hora.
- **SC-004**: El 100 % de los intentos de acción sobre alertas cerradas se rechaza con un mensaje comprensible que indica el estado y el actor.
- **SC-005**: Para cada alerta, el score mostrado coincide con el producto de los factores de su desglose (verificable en el 100 % de las alertas sembradas).
- **SC-006**: Los filtros de la lista se conservan tras recargar o compartir el enlace en el 100 % de los casos probados.
- **SC-007**: Las vistas de lista y detalle cargan en menos de 1 segundo en el equipo local.
- **SC-008**: Ninguna evidencia ni texto contiene datos personales o personas identificables.

## Assumptions

- La feature 001 está completa (catálogos, actor, formato de error, shell y componentes base).
- Sin tiempo real en esta feature: las listas se actualizan al cargar la vista, al realizar acciones o con "Reintentar"; las actualizaciones en vivo llegan en la feature 003.
- Los incidentes se crean al confirmar, pero su vista sigue siendo un placeholder hasta la feature 004; el histórico de 30 días y los incidentes de hoy se siembran en la 004.
- Las alertas de la anomalía se siembran como descartadas para no depender de incidentes; la detección y la visualización de anomalías llegan en las features 005 y 007.
- El atajo "activas" del filtro de estado equivale a nueva + en revisión (doc 08 §3.3) y es el filtro por defecto de la vista.
- El orden por defecto es score descendente con desempate por la fecha más reciente.
- Las ilustraciones de evidencia (una por tipo) se crean como archivos estáticos propios del proyecto, sin recursos externos.
- El plano 2D de ubicación reutiliza la geometría de zonas sembrada en la feature 001; el mismo componente servirá de mini-mapa en el Resumen (005) y de alternativa al 3D (006).
- El contador de alertas pendientes del menú y el botón "Críticas (N)" siguen deshabilitados hasta las features 003 y 005.
- Validación manual con quickstart.md y los ítems HU-04, HU-06 y HU-10 a HU-15 del checklist del doc 11 §3.
