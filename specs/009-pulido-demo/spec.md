# Feature Specification: Pulido final de la demo

**Feature Branch**: `009-pulido-demo`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Feature 009-pulido-demo de AeroSecure AI: dejar la demo lista para presentar — rendimiento de carga (división del código), revisión transversal de estados de interfaz, accesibilidad, tablet y microcopy; recorrido completo del guion y del checklist del doc 11 corrigiendo lo que falle; README de ejecución. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/arquitectura-y-diseño/09-ui-ux.md` (§4 estados, §6 accesibilidad, §7 responsive, §8 microcopy), `11-guion-demo-y-aceptacion.md` (§1-§4), `docs/docs-generales/03-requisitos.md` (RNF-01, RNF-03, RNF-07 a RNF-09), constitución (principios IV, VI, IX).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Presentar la demo de principio a fin sin tropiezos (Priority: P1)

Quien presenta sigue el guion del doc 11 (preparación + 13 pasos, ≈ 7 min) y todo funciona a la primera: reinicio, escenario crítico en vivo, revisión, confirmación, asignación, escalamiento, resolución, falso positivo, mapa 3D, análisis y exportación.

**Why this priority**: es el objetivo final del proyecto.

**Independent Test**: ejecutar el guion completo con el arranque de un comando y registrar el resultado de cada paso.

**Acceptance Scenarios**:

1. **Given** una instalación limpia, **When** se ejecuta el comando de arranque, **Then** la demo queda lista sin errores en consola y el navegador se abre.
2. **Given** el guion del doc 11 §2, **When** se recorre completo, **Then** cada paso produce el resultado descrito, sin errores ni pantallas vacías inesperadas.
3. **Given** el checklist del doc 11 §3, **When** se verifica, **Then** todos los ítems verificables quedan cumplidos o documentados como limitación conocida.

---

### User Story 2 - Carga rápida y sensación de producto terminado (Priority: P2)

La aplicación abre rápido: el código de vistas pesadas (gráficos, mapa 3D) se carga solo cuando se necesita, y todas las vistas presentan estados de carga, vacío, error y éxito consistentes y textos sin afirmaciones de certeza (RNF-03, RNF-09).

**Independent Test**: medir el tamaño de la carga inicial antes y después; revisar cada vista en sus 4 estados.

**Acceptance Scenarios**:

1. **Given** la construcción de producción, **When** se analiza, **Then** ningún fragmento de carga inicial supera 500 kB y los gráficos y el 3D están en fragmentos diferidos.
2. **Given** cada vista con datos, **When** se fuerza un error de red, **Then** muestra un estado de error comprensible con "Reintentar".
3. **Given** los textos de la interfaz, **When** se revisan, **Then** siguen el microcopy del doc 09 §8 (sin certezas, estados legibles, español neutro).

---

### User Story 3 - Accesible y usable en tablet (Priority: P2)

Toda la aplicación se usa con teclado (orden lógico, foco visible, diálogos que atrapan el foco), mantiene contraste AA, comunica severidad y estado con icono + texto y funciona en tablet (768-1023 px) con el menú colapsado y sin desbordes (RNF-07, RNF-08).

**Independent Test**: recorrer las vistas principales solo con teclado y en una ventana de 900 px.

**Acceptance Scenarios**:

1. **Given** cualquier vista, **When** se navega con Tab, **Then** el foco es visible y sigue un orden lógico, con enlace "Saltar al contenido".
2. **Given** una ventana de 900 px, **When** se recorren las vistas, **Then** no hay contenido cortado ni desplazamientos horizontales inesperados (salvo tablas, que se desplazan dentro de su contenedor).

### Edge Cases

- Arranque cerca de la medianoche: los datos de "hoy" se generan igualmente; las variaciones pueden mostrar "Sin datos" (documentado).
- Detener la demo con Ctrl+C en las ventanas de `start-demo.ps1`: se cierra sin errores.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La construcción MUST dividir el código: vistas de Análisis, Reportes, Configuración, Mapa y gráficos del Resumen cargadas de forma diferida, y librerías pesadas (gráficos, 3D) en fragmentos propios; ningún fragmento inicial > 500 kB.
- **FR-002**: Todas las vistas MUST cumplir los estados del doc 09 §4 y el microcopy del §8; se corrigen las desviaciones encontradas.
- **FR-003**: La aplicación MUST cumplir la accesibilidad del doc 09 §6 y el responsive del §7 en las vistas principales; se corrigen las desviaciones encontradas.
- **FR-004**: El recorrido completo del guion y del checklist del doc 11 MUST ejecutarse y documentarse; los fallos encontrados se corrigen en esta feature.
- **FR-005**: El repositorio MUST incluir un README raíz con requisitos, arranque, preparación de la demo, perfiles y solución de problemas, coherente con el doc 11.
- **FR-006**: Sin pruebas automatizadas ni dependencias nuevas.

## Success Criteria *(mandatory)*

- **SC-001**: El guion completo de 7 minutos se ejecuta sin fallos.
- **SC-002**: La carga inicial de la aplicación se reduce respecto a la feature 008 y ningún fragmento inicial supera 500 kB.
- **SC-003**: El 100 % de los ítems verificables del checklist del doc 11 §3 queda marcado como cumplido o con limitación documentada.

## Assumptions

- Features 001-008 completas.
- Las verificaciones visuales se hacen con el navegador local (Edge) en modo automatizado y se complementan con una lista de comprobaciones que debe hacer una persona (GPU real, Excel, lectores de pantalla).
