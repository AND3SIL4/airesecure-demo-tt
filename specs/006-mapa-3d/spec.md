# Feature Specification: Mapa 3D de la terminal

**Feature Branch**: `006-mapa-3d`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Feature 006-mapa-3d de AeroSecure AI: vista Mapa con maqueta 3D de la Terminal 1 ficticia, zonas coloreadas por riesgo con etiquetas de texto, marcadores de alertas activas, orbitar/zoom/presets de cámara, selección de zona con panel lateral, apertura de alertas desde marcadores, alternativa 2D sin WebGL y lista accesible de zonas. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/arquitectura-y-diseño/09-ui-ux.md` (§3.7 Mapa, §5.1 colores, §6 accesibilidad, §7 tablet), `07-modelo-de-datos.md` (§3.1 zonas) y `specs/001-fundacion/data-model.md` (geometría), `06-arquitectura.md` (§2.2, `presentation/map3d/`). Historias HU-08 (doc 02); RF-E1 a RF-E5 (doc 03); RNF-03 (≥ 30 fps).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ubicar los eventos en una maqueta 3D (Priority: P1)

El operador abre "Mapa" y ve la Terminal 1 en 3D: las 10 zonas como bloques con el color de su riesgo actual y una etiqueta de texto con el nombre y el nivel ("Riesgo: Crítico"), las zonas restringidas diferenciadas, y un marcador por cada alerta activa con el color de su severidad (las críticas con un pulso suave). Puede orbitar, hacer zoom y usar los presets "Vista superior", "Vista isométrica" y "Reiniciar cámara" (HU-08, RF-E1 a RF-E3).

**Why this priority**: es la pieza visual diferencial de la demo.

**Independent Test**: con los datos sembrados, abrir Mapa y comprobar los colores y etiquetas de las 10 zonas, los 12 marcadores, la navegación de cámara y los presets.

**Acceptance Scenarios**:

1. **Given** los datos sembrados, **When** se abre Mapa, **Then** se ven las 10 zonas en su posición del plano, cada una con su color de riesgo y una etiqueta legible con el nombre y el nivel en texto.
2. **Given** las zonas restringidas (Puerta de servicio, Plataforma), **When** se ven, **Then** se distinguen por un borde o un rayado además del color.
3. **Given** las alertas activas, **When** se muestra la escena, **Then** hay un marcador por alerta dentro de su zona, con el color de su severidad; los críticos pulsan salvo que el usuario prefiera reducir el movimiento.
4. **Given** la escena, **When** el usuario arrastra o usa la rueda, **Then** la cámara orbita y hace zoom dentro de límites (no atraviesa el suelo); los botones de preset cambian la vista.

---

### User Story 2 - Explorar una zona y abrir sus alertas (Priority: P1)

Al pasar el cursor sobre una zona se resalta; al hacer clic se selecciona y el panel lateral muestra sus alertas activas. Al hacer clic en un marcador se abre el detalle de esa alerta. La zona seleccionada queda en la dirección de la página (RF-E3, RF-E4).

**Why this priority**: convierte el mapa en una herramienta operativa, no solo decorativa.

**Independent Test**: hacer clic en la Sala de embarque A y comprobar el panel con sus alertas y la dirección `?zone=T1-EMBARQUE-A`; hacer clic en un marcador y comprobar la navegación al detalle.

**Acceptance Scenarios**:

1. **Given** el mapa, **When** se hace clic en una zona, **Then** queda resaltada, la dirección incluye la zona y el panel lateral lista sus alertas activas (severidad, tipo y hora) con enlaces.
2. **Given** una zona sin alertas activas, **When** se selecciona, **Then** el panel indica "Sin alertas activas en esta zona".
3. **Given** un marcador, **When** se hace clic, **Then** se abre el detalle de la alerta.
4. **Given** la dirección con `?zone=…`, **When** se carga la página, **Then** esa zona aparece seleccionada.

---

### User Story 3 - Acceso accesible y alternativa sin 3D (Priority: P2)

El panel lateral siempre ofrece la lista de las 10 zonas con su estado (icono, texto y número de alertas), operable con teclado, como alternativa accesible a la escena. Si el navegador no soporta WebGL, se muestra el plano 2D con el aviso "Vista 2D (WebGL no disponible)" (RF-E5). En tablet, el panel pasa a un cajón desplegable.

**Why this priority**: garantiza accesibilidad y robustez de la demo.

**Independent Test**: navegar la lista de zonas solo con teclado y seleccionar una; forzar el modo sin WebGL y comprobar el plano 2D.

**Acceptance Scenarios**:

1. **Given** el panel de zonas, **When** se navega con Tab y Enter, **Then** se puede seleccionar cualquier zona y la escena la resalta.
2. **Given** un navegador sin WebGL, **When** se abre Mapa, **Then** se ve el plano 2D con colores, marcadores y el aviso, y la selección de zona sigue funcionando.
3. **Given** una pantalla de tablet, **When** se abre Mapa, **Then** la escena ocupa el ancho y el panel se abre como cajón con un botón "Zonas".

---

### User Story 4 - Mapa en vivo y rendimiento (Priority: P3)

La escena se actualiza sin recargar cuando llegan o se cierran alertas, mantiene una fluidez de al menos 30 fps en un portátil estándar y no consume recursos cuando está quieta. La carga del motor 3D no ralentiza el resto de la aplicación (RNF-03).

**Independent Test**: disparar un escenario con el mapa abierto y ver el nuevo marcador en ≤ 2 s; comprobar que el resto de vistas carga sin el motor 3D.

**Acceptance Scenarios**:

1. **Given** el mapa abierto, **When** llega una alerta crítica, **Then** aparece su marcador y el color de la zona cambia en ≤ 2 s.
2. **Given** la escena quieta, **When** no hay interacción ni pulsos, **Then** no se redibuja continuamente.
3. **Given** el usuario navega a otra vista, **When** sale del mapa, **Then** se liberan los recursos de la escena.

### Edge Cases

- Muchas alertas en una zona: los marcadores se distribuyen en cuadrícula dentro del bloque sin salirse.
- Redimensionar la ventana: la escena se adapta sin deformarse.
- Error al cargar zonas o alertas: estado de error con "Reintentar" (la escena no se monta vacía sin explicación).
- Clic en una zona vacía de la losa (fuera de zonas): no cambia la selección.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La vista Mapa MUST renderizar la Terminal 1 con las 10 zonas usando su geometría (posición y tamaño en metros), coloreadas por riesgo con la paleta de severidades y una etiqueta de texto por zona (nombre + nivel).
- **FR-002**: Las zonas restringidas MUST distinguirse visualmente además del color.
- **FR-003**: Cada alerta activa MUST tener un marcador dentro de su zona con el color de su severidad; los críticos pulsan solo si no hay preferencia de movimiento reducido.
- **FR-004**: La cámara MUST permitir orbitar y hacer zoom con límites, y ofrecer los presets "Vista superior", "Vista isométrica" y "Reiniciar cámara".
- **FR-005**: El clic en una zona MUST seleccionarla (resaltado y `?zone=` en la dirección) y mostrar sus alertas activas en el panel lateral; el clic en un marcador MUST abrir el detalle de la alerta; el hover resalta.
- **FR-006**: El panel lateral MUST listar las 10 zonas con icono, texto de riesgo y número de alertas, operable con teclado, y sincronizado con la selección de la escena.
- **FR-007**: Sin WebGL, la vista MUST mostrar el plano 2D existente con el aviso "Vista 2D (WebGL no disponible)" y la misma interacción de selección.
- **FR-008**: La escena MUST actualizarse en vivo con los datos de zonas y alertas, renderizar bajo demanda y liberar sus recursos al salir.
- **FR-009**: El motor 3D MUST cargarse solo al entrar en la vista Mapa, sin aumentar la carga inicial de la aplicación.
- **FR-010**: Estados de carga, error con reintento y vacío; en tablet, el panel pasa a cajón.
- **FR-011**: Capas de la constitución (la escena aislada recibe datos por propiedades y no consulta la API); sin pruebas automatizadas. Dependencia nueva aprobada: Three.js.

### Key Entities

- **Zona** (existente): geometría, riesgo, alertas activas, restringida.
- **Marcador**: alerta activa (id, zona, severidad) representada en la escena.

## Success Criteria *(mandatory)*

- **SC-001**: Una persona identifica la zona con mayor riesgo en menos de 5 segundos tras abrir el Mapa.
- **SC-002**: La escena se mantiene a ≥ 30 fps al orbitar en un portátil estándar.
- **SC-003**: La carga inicial de la aplicación (Resumen) no aumenta por la incorporación del motor 3D.
- **SC-004**: El 100 % de las zonas y alertas activas aparecen en la escena y en la lista accesible.
- **SC-005**: Un cambio de alertas se refleja en el mapa en ≤ 2 segundos.

## Assumptions

- Los datos ya existen: `GET /api/zones` (geometría, riesgo, alertas activas) y `GET /api/alerts?status=activas`; no se requieren cambios de backend.
- Three.js está aprobado en la constitución; se usa sin capas adicionales (sin react-three-fiber), con `OrbitControls` y `CSS2DRenderer` de sus ejemplos.
- La escena se crea con geometría generada por código (sin modelos externos).
- La escena muestra hasta 100 alertas activas (máximo de página de la API); si hubiera más, se avisa "Se muestran N de M". En la demo no se alcanza ese volumen.
- Validación manual con quickstart.md y HU-08 del doc 11 §3.
