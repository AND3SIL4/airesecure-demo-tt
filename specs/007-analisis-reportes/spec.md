# Feature Specification: Análisis y reportes

**Feature Branch**: `007-analisis-reportes`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Feature 007-analisis-reportes de AeroSecure AI: vista Análisis con gráficos por zona, por tipo, evolución diaria por severidad, confirmadas frente a falsos positivos, tiempos medios y anomalías, con selector de 7/14/30 días; vista Reportes (supervisor) con filtros, vista previa y descarga CSV; botón Exportar CSV en Incidentes para supervisor. Sin pruebas automatizadas."

**Fuentes de verdad**: `docs/docs-generales/05-estados-y-reglas-de-dominio.md` (§6 métricas, §7 anomalías), `docs/arquitectura-y-diseño/08-especificacion-api.md` (§3.5), `09-ui-ux.md` (§3.5 Exportar CSV, §3.8 Análisis, §3.9 Reportes, §4, §6). Historias HU-22 a HU-25 (doc 02); RF-F1 a RF-F4 (doc 03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analizar tendencias para decidir (Priority: P1)

El supervisor abre Análisis, elige el rango (7, 14 o 30 días) y ve: incidentes por zona, por tipo, evolución diaria por severidad, la proporción de alertas confirmadas frente a falsos positivos (con el número de eventos bajo umbral), los tiempos medios de respuesta y resolución (con su evolución diaria) y las anomalías vigentes. Cada gráfico responde una pregunta y es comprensible sin conocimientos técnicos (HU-22 a HU-24).

**Why this priority**: es el valor para supervisores y administradores; alimenta decisiones preventivas.

**Independent Test**: con el histórico sembrado, cambiar entre 7, 14 y 30 días y comprobar que los totales cambian de forma coherente con el registro de incidentes.

**Acceptance Scenarios**:

1. **Given** el rango de 30 días, **When** se abre Análisis, **Then** se ven los 6 bloques con datos; la suma de "por zona" y de "por tipo" coincide con el total de incidentes abiertos en el rango.
2. **Given** el rango de 7 días, **When** se cambia, **Then** todos los bloques se recalculan y la dirección de la página refleja el rango.
3. **Given** el bloque "Confirmadas frente a falsos positivos", **When** se muestra, **Then** indica los números, el porcentaje de confirmación y los eventos descartados por el umbral.
4. **Given** el bloque de anomalías, **When** se muestra, **Then** lleva la etiqueta "Detección basada en reglas · demostrativa" (o "Sin anomalías detectadas").
5. **Given** cualquier gráfico, **When** se usa con teclado o lector de pantalla, **Then** tiene título-pregunta, tooltip y un resumen textual.

---

### User Story 2 - Exportar incidentes a CSV (Priority: P1)

El supervisor abre Reportes, filtra (rango, severidad, zona, tipo y estado), ve la vista previa con las 10 primeras filas y el total, y descarga un CSV que se abre correctamente en Excel con tildes. También puede exportar directamente desde el registro de Incidentes con los filtros activos. El operador no ve estas opciones (HU-25, RF-F4).

**Why this priority**: entrega tangible para reuniones y trazabilidad.

**Independent Test**: como supervisor, descargar el CSV con filtros y abrirlo en Excel; como operador, comprobar que no hay botón y que la descarga directa se rechaza.

**Acceptance Scenarios**:

1. **Given** el supervisor en Reportes, **When** aplica filtros, **Then** ve la vista previa (10 filas) y el total que coincide con el registro de Incidentes con los mismos filtros.
2. **Given** la vista previa, **When** pulsa "Descargar CSV", **Then** se descarga `incidentes-AAAAMMDD-HHMM.csv` con cabeceras en español, todas las filas filtradas y fechas en hora de Bogotá, legible en Excel (tildes correctas).
3. **Given** el supervisor en Incidentes, **When** pulsa "Exportar CSV", **Then** se descarga el CSV con los filtros activos de la vista.
4. **Given** un operador, **When** está en Incidentes, **Then** no ve "Exportar CSV"; y si intenta la descarga directa, se rechaza con "Esta acción es solo para supervisores.".
5. **Given** filtros sin resultados, **When** se intenta descargar, **Then** el botón está deshabilitado con el motivo "No hay incidentes para exportar".

### Edge Cases

- Rango sin datos: cada bloque muestra su estado vacío.
- Error al cargar un bloque: ese bloque muestra error con reintento sin romper los demás.
- Descarga fallida (red): aviso de error con el mensaje.
- Campos con comas, comillas o saltos de línea (descripción, notas): se escapan correctamente en el CSV.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer, para un rango de 7, 14 o 30 días: incidentes por zona y por tipo (de la alerta de origen, por fecha de apertura), evolución diaria de incidentes por severidad, tiempos medios de respuesta y resolución (global y por día), resultados de alertas (confirmadas, descartadas, tasa de confirmación y eventos bajo umbral acumulados) y anomalías vigentes (regla del doc 05 §7).
- **FR-002**: La vista Análisis MUST mostrar los 6 bloques del doc 09 §3.8 con selector de rango en la dirección, títulos-pregunta, tooltips, resumen accesible y estados de carga, error y vacío por bloque.
- **FR-003**: El sistema MUST generar un CSV de incidentes con los mismos filtros del registro, en UTF-8 con BOM, separador coma, cabeceras en español y fechas en hora de Bogotá, solo para supervisores.
- **FR-004**: La vista Reportes (supervisor) MUST ofrecer filtros, vista previa de 10 filas con total y descarga; Incidentes MUST ofrecer "Exportar CSV" solo al supervisor con los filtros activos.
- **FR-005**: Capas de la constitución; sin pruebas automatizadas ni dependencias nuevas.

### Key Entities

- **Serie analítica**: agregaciones por zona, tipo, día y severidad (no persistidas).
- **Reporte CSV**: exportación de incidentes con columnas: ID incidente, ID alerta, tipo, severidad, zona, estado, equipo, escalado a, abierto, inicio de atención, resuelto, tiempo de respuesta (min), tiempo de resolución (min), nota de cierre.

## Success Criteria *(mandatory)*

- **SC-001**: La vista Análisis carga sus 6 bloques en menos de 1 segundo para 30 días.
- **SC-002**: Los totales por zona y por tipo coinciden al 100 % con el registro de incidentes del mismo rango.
- **SC-003**: El CSV se abre en Excel con tildes correctas y el mismo número de filas que el total filtrado.
- **SC-004**: Un operador no puede obtener el CSV (0 descargas en la verificación).

## Assumptions

- Features 001-006 completas; Recharts y la regla de anomalías ya existen (005).
- El contador "bajo umbral" es acumulado desde la siembra (no se filtra por rango); se indica así en la interfaz.
- Validación manual con quickstart.md y HU-22 a HU-25 del doc 11 §3.
