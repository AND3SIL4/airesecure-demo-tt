# Contrato de la UI: 002-alertas

Fuente: `docs/arquitectura-y-diseño/09-ui-ux.md` §3.3, §3.4, §3.11, §4, §6 y §8.

## /alertas
- **Encabezado**: título "Alertas" y el botón "Reportar evento".
- **FilterBar**:
  - Búsqueda con debounce de 300 ms (`q`).
  - Selectores múltiples: Estado (con la opción "Activas" por defecto), Severidad, Zona, Tipo y Fuente.
  - "Limpiar filtros" y chips removibles por cada filtro activo.
  - Todo se sincroniza con la URL (`?status=&severity=&zone=&type=&source=&q=&sort=&page=`). Los valores inválidos se ignoran.
- **Tabla**:
  - Columnas: Prioridad (SeverityBadge), ID, Tipo, Zona, Fuente, Confianza (barra + % o "N/A"), Score, Estado (StatusBadge), Hora (relativa, con la absoluta en un tooltip) y una flecha.
  - Encabezados de Score, Hora y Prioridad ordenables (`aria-sort`).
  - Filas enfocables: ↑ y ↓ mueven el foco, Enter y clic abren el detalle.
  - `?highlight=ALT-xxxx` resalta esa fila 2 s (`motion-safe`).
- **Paginación**: 20 por página, con "Página X de Y · N alertas".
- **Estados**: Skeleton de tabla; EmptyState "Sin alertas que coincidan" con "Limpiar filtros"; ErrorState con "Reintentar".

## /alertas/:id
- **Encabezado**: SeverityBadge, StatusBadge, ID, tipo, zona, hora absoluta y relativa, y el chip "Predicción demostrativa" (en reportes manuales: "Reporte humano · demostrativo", porque no hay predicción).
- **Columna principal (8/12)**:
  1. EvidenceViewer: marco de cámara con la fuente y la hora; SVG; recuadro de detección; leyenda "Imagen ilustrativa · sin datos personales".
  2. Descripción.
  3. ScoreBreakdown "Por qué se priorizó": barra del score y 3 factores con sus valores; nota "Severidad × confianza × criticidad de zona".
  4. Recomendación y Protocolo (checklist visual no persistente).
  5. Timeline.
- **Columna lateral (4/12)**:
  - Ubicación (MiniMap2D con la zona resaltada y su nombre).
  - Confianza (ConfidenceMeter o "N/A: reporte humano").
  - Barra de acciones:
    - `nueva` o `en_revision`: "Confirmar incidente" (primario), "Marcar como falso positivo" (secundario) y "Comentar".
    - `confirmada`: el enlace "Ver incidente INC-xxxx" (a `/incidentes/INC-xxxx`, placeholder) y "Comentar".
    - `descartada`: el motivo (y su comentario), quién la descartó y cuándo, y "Comentar".
- **Diálogos**:
  - Confirmar: ConfirmDialog con textarea "Nota (opcional)" de hasta 500 caracteres.
  - Falso positivo: Dialog con radios de motivo, un textarea obligatorio si el motivo es "Otro" (≥ 10) y confirmación final dentro del mismo diálogo.
  - Comentar: Dialog con un textarea de 3 a 500 caracteres.
- Al abrir una alerta `nueva` se envía `review` automáticamente una sola vez.
- **Avisos**:
  - "Alerta ALT-xxxx confirmada. Se creó el incidente INC-xxxx" (con la acción "Ver incidente").
  - "Alerta ALT-xxxx descartada como falso positivo."
  - "Comentario registrado."
  - Los errores muestran el mensaje del backend.
- **Estados**: Skeleton del detalle; ErrorState (404 "La alerta ALT-xxxx no existe" con un enlace a la lista); botones con `loading`.

## Modal "Reportar evento"
- Se abre desde la Topbar (botón ahora habilitado) y desde /alertas.
- **Campos**: Tipo (select desde `/alert-types`), Zona (select desde `/zones`), Severidad sugerida (radio con SeverityBadge) y Descripción (textarea de 10 a 500 con contador). Si el tipo tiene severidad por defecto, se preselecciona.
- Validación en línea; "Reportar" deshabilitado mientras sea inválido.
- **Éxito**: el aviso "Evento reportado como ALT-xxxx", cerrar el modal y navegar a `/alertas?highlight=ALT-xxxx`.
